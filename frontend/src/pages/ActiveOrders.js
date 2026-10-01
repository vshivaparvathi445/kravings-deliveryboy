// ═══ ActiveOrders.js ═══

import React, { useEffect, useState } from 'react';
import { FiPhone, FiNavigation, FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ActiveOrders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!orders || orders.length === 0) return;

    const sendLocation = () => {

        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(

            (position) => {

                const { latitude, longitude } = position.coords;

                // ప్రస్తుతం active (assigned/picked) గా ఉన్న ప్రతి ఆర్డర్‌కి లొకేషన్ పంపండి
                orders.forEach((order) => {

                    api.post(`/orders/${order.id}/location`, {
                        lat: latitude,
                        lng: longitude
                    }).catch((err) => {
                        console.error(
                            `Location update failed for order ${order.id}:`,
                            err
                        );
                    });

                });
            },

            (err) => console.error("Geolocation error:", err)
        );
    };

    sendLocation();

    const interval = setInterval(sendLocation, 15000); // ప్రతి 15 సెకన్లు

    return () => clearInterval(interval);

}, [orders]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {

    setLoading(true);

    try {

      const res = await api.get('/orders/active');

      setOrders(res.data.orders || []);

    } catch (error) {

      console.error('Active Orders Error:', error);

      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Unable to load active orders';

      toast.error(message);

      setOrders([]);

    } finally {

      setLoading(false);

    }
  }

  // =====================================================
  // PICKUP
  // POST /api/orders/<id>/pickup
  // =====================================================

  async function markPickup(id) {

    try {

      await api.post(`/orders/${id}/pickup`);

      toast.success('Order marked as picked up! 📦');

      await loadOrders();

    } catch (error) {

      console.error('Pickup Error:', error);

      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Unable to mark order as picked up'
      );

    }
  }

  // =====================================================
  // DELIVER
  // POST /api/orders/<id>/deliver
  // =====================================================

  async function markDelivered(id) {

    const code = window.prompt(
      'Enter the 4-digit OTP provided by the customer:'
    );

    if (!code) {
      return;
    }

    const cleanOtp = code.trim();

    if (!/^\d{4}$/.test(cleanOtp)) {

      toast.error('Please enter a valid 4-digit OTP');

      return;
    }

    console.log('SENDING assignment_id:', id, 'OTP:', cleanOtp);   // TEMP DEBUG

    try {

      const res = await api.post(`/orders/${id}/deliver`, { otp: cleanOtp });

      toast.success(
        res.data.message || 'Order delivered successfully! 🎉'
      );

      await loadOrders();

    } catch (error) {

      console.error('Delivery Error:', error);

      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Unable to complete delivery'
      );

    }
  }

  // =====================================================
  // CANCEL
  // POST /api/orders/<id>/cancel
  // =====================================================

  async function cancelOrder(id) {

    const reason =
      window.prompt(
        'Reason for cancellation (optional):'
      ) || 'Cancelled by rider';

    try {

      await api.post(
        `/orders/${id}/cancel`,
        {
          reason
        }
      );

      toast.success('Order cancelled');

      await loadOrders();

    } catch (error) {

      console.error('Cancel Error:', error);

      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Cannot cancel order'
      );

    }
  }

  if (loading) {
    return <LoadingCards />;
  }

  return (
    <div>

      <div className="sec-hd">

        <div>
          <h3>Active Orders</h3>

          <small style={{ color: 'var(--muted)' }}>
            Assigned and picked-up deliveries
          </small>
        </div>

        <button
          className="btn-icon"
          onClick={loadOrders}
          title="Refresh"
          style={{
            color: 'var(--or)'
          }}
        >
          <FiRefreshCw />
        </button>

      </div>

      {orders.length === 0 ? (

        <div className="empty-state">

          <div className="es-icon">
            🏍️
          </div>

          <h4>
            No Active Orders
          </h4>

          <p>
            Accept new requests to start delivering!
          </p>

        </div>

      ) : (

        orders.map(order => (

          <ActiveCard
            key={order.id}
            order={order}
            onPickup={markPickup}
            onDeliver={markDelivered}
            onCancel={cancelOrder}
          />

        ))

      )}

    </div>
  );
}


// =========================================================
// ACTIVE ORDER CARD
// =========================================================

function ActiveCard({
  order,
  onPickup,
  onDeliver,
  onCancel
}) {

  const stMap = {

    assigned: {
      cls: 'sp-assigned',
      label: 'Assigned',
      icon: '📦'
    },

    picked: {
      cls: 'sp-picked',
      label: 'Picked Up',
      icon: '🏍️'
    }

  };

  const st =
    stMap[order.status] ||
    stMap.assigned;


  function openNavigation() {

    let lat;
    let lng;

    if (order.status === 'assigned') {

      lat = order.pickup_lat;
      lng = order.pickup_lng;

    }

    if (order.status === 'picked') {

      lat = order.drop_lat;
      lng = order.drop_lng;

    }

    if (
      lat === null ||
      lat === undefined ||
      lng === null ||
      lng === undefined
    ) {

      toast.error(
        'Location coordinates are not available'
      );

      return;
    }

    const mapsUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(
      mapsUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }


  function getItemsText() {

    if (
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {

      return `${order.item_count || 0} items`;

    }

    return order.items
      .map((item) => {

        if (typeof item === 'string') {
          return item;
        }

        const name =
          item.food_name ||
          item.name ||
          item.item_name ||
          item.product_name ||
          'Item';

        const quantity =
          item.quantity ||
          item.qty ||
          1;

        return `${name} ×${quantity}`;

      })
      .join(', ');
  }


  return (

    <div className="order-card">

      <div className="oc-top">

        <div>

          <div className="oc-id">
            #{order.order_number || `Assignment ${order.id}`}
            {order.order_id && (
              <span
                style={{
                  marginLeft: 6,
                  fontWeight: 400,
                  fontSize: '.78rem',
                  color: 'var(--muted)'
                }}
              >
                (Order ID: {order.order_id})
              </span>
            )}
          </div>

          <div className="oc-time">

            🕐{' '}

            {order.assigned_at
              ? new Date(
                  order.assigned_at
                ).toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit'
                  }
                )
              : 'Time unavailable'
            }

          </div>

        </div>


        <span
          className={`status-pill ${st.cls}`}
        >
          {st.icon} {st.label}
        </span>

      </div>


      <div className="oc-route">

        <div className="route-line">

          <div className="route-dot rd-pick" />

          <div className="route-connector" />

          <div className="route-dot rd-drop" />

        </div>


        <div className="route-stops">

          <div>

            <div className="stop-type st-pick">
              Pickup
            </div>

            <div className="stop-name">
              {order.pickup_address || 'Not available'}
            </div>

          </div>


          <div>

            <div className="stop-type st-drop">
              Delivery
            </div>

            <div className="stop-name">
              {order.drop_address || 'Not available'}
            </div>

            <div className="stop-addr">

              {order.customer_name || 'Customer'}
              {order.customer_id && (
                <span style={{ color: 'var(--muted)' }}>
                  {' '}(ID: {order.customer_id})
                </span>
              )}

              {order.customer_phone && (
                <>
                  {' · '}
                  {order.customer_phone}
                </>
              )}

            </div>

          </div>

        </div>

      </div>


      <div className="oc-meta">

        <div className="meta-chip">

          📦 {getItemsText()}

        </div>

        <div className="meta-chip">

          🛍️ {order.item_count || 0} items

        </div>

        <div className="meta-chip">

          📍{' '}

          {order.distance_km !== null &&
          order.distance_km !== undefined
            ? `${order.distance_km} km`
            : 'N/A'
          }

        </div>

        <div className="meta-chip">

          ⏱️ {order.estimated_time || 'N/A'}

        </div>

      </div>


      <div className="oc-actions">

        {order.status === 'assigned' && (

          <button
            className="btn-primary"
            style={{
              flex: 1,
              padding: 12
            }}
            onClick={() =>
              onPickup(order.id)
            }
          >
            📦 Mark Picked Up
          </button>

        )}

        {order.status === 'picked' && (

          <button
            className="btn-success"
            style={{
              flex: 1,
              padding: 12
            }}
            onClick={() =>
              onDeliver(order.id)
            }
          >
            ✅ Mark Delivered
          </button>

        )}

        {order.customer_phone && (

          <button
            className="btn-icon"
            title="Call Customer"
            style={{
              background: 'var(--bll)',
              color: 'var(--bl)',
              borderRadius: 12,
              padding: '0 14px'
            }}
            onClick={() =>
              window.open(
                `tel:${order.customer_phone}`
              )
            }
          >
            <FiPhone />
          </button>

        )}

        <button
          className="btn-icon"
          title={
            order.status === 'assigned'
              ? 'Navigate to pickup'
              : 'Navigate to customer'
          }
          style={{
            background: 'var(--lt)',
            border: '1.5px solid var(--bd)',
            borderRadius: 12,
            padding: '0 14px',
            fontSize: '.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          onClick={openNavigation}
        >

          <FiNavigation />

          {order.status === 'assigned'
            ? 'Pickup'
            : 'Navigate'
          }

        </button>

        {order.status === 'assigned' && (

          <button
            className="btn-danger"
            title="Cancel Order"
            style={{
              padding: '0 14px'
            }}
            onClick={() =>
              onCancel(order.id)
            }
          >
            ✕
          </button>

        )}

      </div>

    </div>

  );
}


// =========================================================
// LOADING
// =========================================================

function LoadingCards() {

  return (

    <>
      {[1, 2].map(i => (

        <div
          key={i}
          className="order-card"
          style={{
            opacity: .5
          }}
        >

          <div
            style={{
              height: 20,
              background: 'var(--bd)',
              borderRadius: 8,
              width: '40%',
              marginBottom: 12
            }}
          />

          <div
            style={{
              height: 80,
              background: 'var(--lt)',
              borderRadius: 12,
              marginBottom: 12
            }}
          />

          <div
            style={{
              height: 14,
              background: 'var(--bd)',
              borderRadius: 8,
              width: '70%'
            }}
          />

        </div>

      ))}
    </>

  );
}