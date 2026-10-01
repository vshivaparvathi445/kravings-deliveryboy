import random, string
from datetime import datetime, date,timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import DeliveryAssignment, CustomerOrder, Earning, DeliveryBoy, Notification, User, Vendor, OrderRejection, Customer

orders_bp = Blueprint("orders", __name__)


def _rider():
    return DeliveryBoy.query.get_or_404(int(get_jwt_identity()))


def _gen_otp():
    return "".join(random.choices(string.digits, k=4))


def _create_earning(boy_id, assignment, earn_type="delivery"):
    e = Earning(
        delivery_boy_id = boy_id,
        assignment_id   = assignment.id,
        earn_type       = earn_type,
        amount          = assignment.total_earn or 0,
        description     = f"Delivery for order #{assignment.order_id}",
        earn_date       = date.today(),
    )
    db.session.add(e)


def _notify(boy_id, title, body, notif_type="order"):
    n = Notification(delivery_boy_id=boy_id, title=title, body=body, notif_type=notif_type)
    db.session.add(n)


def _new_customer_order_dict(o: CustomerOrder):
    """Serialize a CustomerOrder row that has no assignment yet (for /new)."""
    customer_id    = None
    customer_name  = None
    customer_phone = None
    pickup_address = None
    pickup_lat     = None
    pickup_lng     = None

    if o.user_id:
        customer_id = o.user_id
        customer = db.session.get(Customer, o.user_id)
        if customer:
            customer_name  = customer.customer_name
            customer_phone = customer.phone_no

    if o.vendor_id:
        vendor = db.session.get(Vendor, o.vendor_id)
        if vendor:
            pickup_address = vendor.address
            try:
                pickup_lat = float(vendor.latitude) if vendor.latitude else None
                pickup_lng = float(vendor.longitude) if vendor.longitude else None
            except (TypeError, ValueError):
                pickup_lat = pickup_lng = None

    return {
        "id":              o.id,
        "order_id":        o.id,
        "order_number":    o.order_number,
        "customer_id":    customer_id,
        "customer_name":   customer_name,
        "customer_phone":  customer_phone,
        "pickup_address":  pickup_address,
        "pickup_lat":      pickup_lat,
        "pickup_lng":      pickup_lng,
        "drop_address":    o.delivery_address,
        "item_count":      o.quantity,
        "total_amount":    o.total_amount,
        "payment_method":  o.payment_method,
        "created_at":      o.created_at.isoformat() if o.created_at else None,
    }


# ── ACTIVE ORDERS ────────────────────────────────────────────
@orders_bp.route("/active", methods=["GET"])
@jwt_required()
def active_orders():
    boy = _rider()
    assignments = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status.in_(["assigned", "picked"])
    ).order_by(DeliveryAssignment.assigned_at.desc()).all()
    return jsonify({"orders": [a.to_dict() for a in assignments]}), 200


# ── NEW / AVAILABLE ORDERS ───────────────────────────────────
@orders_bp.route("/new", methods=["GET"])
@jwt_required()
def new_orders():
    boy = _rider()
    if not boy.is_online:
        return jsonify({"orders": [], "message": "Go online to receive orders"}), 200

    active_count = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status.in_(["assigned", "picked"])
    ).count()
    if active_count >= 3:
        return jsonify({
            "orders": [],
            "message": "You have 3 active orders. Complete one to receive new requests."
        }), 200

    assigned_order_ids = db.session.query(DeliveryAssignment.order_id)

    # ఈ రైడర్ ఇప్పటికే reject చేసిన ఆర్డర్లు
    assigned_order_ids = db.session.query(DeliveryAssignment.order_id)

    rejected_order_ids = db.session.query(OrderRejection.order_id).filter(
        OrderRejection.delivery_boy_id == boy.id
    )

    cutoff = datetime.utcnow() - timedelta(hours=3)

    candidates = CustomerOrder.query.filter(
        CustomerOrder.id.notin_(assigned_order_ids),
        CustomerOrder.id.notin_(rejected_order_ids),
        db.func.lower(CustomerOrder.status) == "placed",
        CustomerOrder.created_at >= cutoff
    ).order_by(CustomerOrder.created_at.desc()).limit(10).all()

    return jsonify({"orders": [_new_customer_order_dict(o) for o in candidates]}), 200


# ── ORDER HISTORY ────────────────────────────────────────────
@orders_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    boy  = _rider()
    page = request.args.get("page", 1, type=int)
    per  = request.args.get("per_page", 20, type=int)
    status_filter = request.args.get("status")  # delivered | cancelled

    q = DeliveryAssignment.query.filter_by(delivery_boy_id=boy.id)
    if status_filter:
        q = q.filter_by(status=status_filter)
    else:
        q = q.filter(DeliveryAssignment.status.in_(["delivered", "cancelled"]))

    paginated = q.order_by(DeliveryAssignment.created_at.desc()).paginate(
                    page=page, per_page=per, error_out=False)
    return jsonify({
        "orders":   [a.to_dict() for a in paginated.items],
        "total":    paginated.total,
        "pages":    paginated.pages,
        "page":     page,
    }), 200


# ── SINGLE ORDER ─────────────────────────────────────────────
@orders_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_order(assignment_id):
    boy = _rider()
    a   = DeliveryAssignment.query.get_or_404(assignment_id)
    if a.delivery_boy_id and a.delivery_boy_id != boy.id:
        return jsonify({"error": "Unauthorised"}), 403
    return jsonify(a.to_dict()), 200


# ── ACCEPT ORDER ─────────────────────────────────────────────
# order_id here is the CUSTOMER ORDER id (from /new), since no
# assignment exists yet at this point.
@orders_bp.route("/<int:order_id>/accept", methods=["POST"])
@jwt_required()
def accept_order(order_id):
    boy = _rider()
    if not boy.is_online:
        return jsonify({"error": "You must be online to accept orders"}), 400

    o = CustomerOrder.query.get_or_404(order_id)

    existing = DeliveryAssignment.query.filter_by(order_id=order_id).first()
    if existing:
        return jsonify({"error": "Order already taken by another rider"}), 409

    # check rider doesn't have too many active orders
    active_count = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status.in_(["assigned", "picked"])
    ).count()
    if active_count >= 3:
        return jsonify({"error": "Cannot accept more than 3 orders at a time"}), 400

    pickup_lat = pickup_lng = None
    if o.vendor_id:
        vendor = db.session.get(Vendor, o.vendor_id)
        if vendor:
            try:
                pickup_lat = float(vendor.latitude) if vendor.latitude else None
                pickup_lng = float(vendor.longitude) if vendor.longitude else None
            except (TypeError, ValueError):
                pass

    assignment = DeliveryAssignment(
        order_id        = o.id,
        delivery_boy_id = boy.id,
        status          = "assigned",
        assigned_at     = datetime.utcnow(),
        otp_code        = _gen_otp(),
        pickup_lat      = pickup_lat,
        pickup_lng      = pickup_lng,
        base_earn       = 0,   # TODO: set your delivery fee logic here
        total_earn      = 0,
    )
    db.session.add(assignment)
    db.session.flush()  # get assignment.id

    boy.acceptance_rate = min(100, float(boy.acceptance_rate or 0) + 1)

    _notify(boy.id, "Order Accepted",
            f"You accepted order #{o.order_number}.")
    db.session.commit()

    return jsonify({"message": "Order accepted", "order": assignment.to_dict()}), 200


# ── MARK PICKED UP ───────────────────────────────────────────
@orders_bp.route("/<int:assignment_id>/pickup", methods=["POST"])
@jwt_required()
def pickup_order(assignment_id):
    boy = _rider()
    a   = DeliveryAssignment.query.get_or_404(assignment_id)

    if a.delivery_boy_id != boy.id:
        return jsonify({"error": "Unauthorised"}), 403
    if a.status != "assigned":
        return jsonify({"error": f"Cannot pick up – order is {a.status}"}), 409

    a.status    = "picked"
    a.picked_at = datetime.utcnow()

    _notify(boy.id, "Picked Up", f"Order #{a.order_id} picked up.")
    db.session.commit()

    return jsonify({"message": "Marked as picked up", "order": a.to_dict()}), 200


# ── MARK DELIVERED ───────────────────────────────────────────
@orders_bp.route("/<int:assignment_id>/deliver", methods=["POST"])
@jwt_required()
def deliver_order(assignment_id):
    boy  = _rider()
    data = request.get_json(silent=True) or {}
    otp  = data.get("otp", "").strip()

    a = DeliveryAssignment.query.get_or_404(assignment_id)
    print(f"DELIVER attempt - assignment_id={assignment_id}, received_otp='{otp}', stored_otp='{a.otp_code}', status={a.status}")
    if a.delivery_boy_id != boy.id:
        return jsonify({"error": "Unauthorised"}), 403
    if a.status != "picked":
        return jsonify({"error": f"Cannot deliver – order is {a.status}"}), 409
    if a.otp_code and a.otp_code != otp:
        return jsonify({"error": "Invalid OTP. Ask the customer for the 4-digit code."}), 400

    a.status       = "delivered"
    a.delivered_at = datetime.utcnow()

    boy.total_deliveries = (boy.total_deliveries or 0) + 1

    _create_earning(boy.id, a, earn_type="delivery")
    _notify(boy.id, "Delivery Complete!",
        f"Order #{a.order_id} delivered. Rs.{a.total_earn} added to your wallet.")
    db.session.commit()

    return jsonify({
        "message": "Order delivered successfully",
        "earned":  float(a.total_earn),
        "order":   a.to_dict(),
    }), 200


# ── CANCEL ORDER ─────────────────────────────────────────────
@orders_bp.route("/<int:assignment_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_order(assignment_id):
    boy  = _rider()
    data = request.get_json(silent=True) or {}

    a = DeliveryAssignment.query.get_or_404(assignment_id)
    if a.delivery_boy_id != boy.id:
        return jsonify({"error": "Unauthorised"}), 403
    if a.status in ("delivered", "cancelled"):
        return jsonify({"error": f"Cannot cancel – order already {a.status}"}), 409
    if a.status == "picked":
        return jsonify({"error": "Cannot cancel after picking up the order"}), 409

    a.status          = "cancelled"
    a.cancelled_at    = datetime.utcnow()
    a.cancel_reason   = data.get("reason", "No reason provided")
    a.delivery_boy_id = None   # release back to pool

    boy.acceptance_rate = max(0, float(boy.acceptance_rate or 0) - 2)

    _notify(boy.id, "Order Cancelled",
            f"Order #{a.order_id} cancelled. Reason: {a.cancel_reason}")
    db.session.commit()

    return jsonify({"message": "Order cancelled"}), 200


# ── TODAY'S STATS ────────────────────────────────────────────
@orders_bp.route("/stats", methods=["GET"])
@jwt_required()
def today_stats():
    boy   = _rider()
    today = date.today()

    delivered = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status          == "delivered",
        db.func.date(DeliveryAssignment.delivered_at) == today
    ).count()

    from sqlalchemy import func
    earn_row = db.session.query(func.sum(Earning.amount)).filter(
        Earning.delivery_boy_id == boy.id,
        Earning.earn_date       == today
    ).scalar()

    today_earn = float(earn_row or 0)

    dist_row = db.session.query(func.sum(DeliveryAssignment.distance_km)).filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status          == "delivered",
        db.func.date(DeliveryAssignment.delivered_at) == today
    ).scalar()

    pending = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status.in_(["assigned", "picked"])
    ).count()

    completed = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status == "delivered"
    ).count()

    return jsonify({
        "today_deliveries":  delivered,
        "today_earnings":    today_earn,
        "today_distance_km": float(dist_row or 0),
        "rating":            float(boy.rating or 0),
        "total_deliveries":  boy.total_deliveries,
        "acceptance_rate":   float(boy.acceptance_rate or 0),
        "is_online":         boy.is_online,
        "pending_orders":    pending,
        "completed_orders":  completed,
    }), 200



@orders_bp.route("/<int:order_id>/reject", methods=["POST"])
@jwt_required()
def reject_order(order_id):
    boy = _rider()

    # ఆర్డర్ నిజంగా ఉందా అని చెక్ చేయండి
    o = CustomerOrder.query.get_or_404(order_id)

    already = OrderRejection.query.filter_by(
        order_id=order_id, delivery_boy_id=boy.id
    ).first()
    if not already:
        rejection = OrderRejection(order_id=order_id, delivery_boy_id=boy.id)
        db.session.add(rejection)
        db.session.commit()

    return jsonify({"message": "Order rejected"}), 200


@orders_bp.route("/<int:assignment_id>/location", methods=["POST"])
@jwt_required()
def update_location(assignment_id):
    boy = _rider()
    data = request.get_json(silent=True) or {}

    lat = data.get("lat")
    lng = data.get("lng")

    if lat is None or lng is None:
        return jsonify({"error": "lat and lng required"}), 400

    a = DeliveryAssignment.query.get_or_404(assignment_id)
    if a.delivery_boy_id != boy.id:
        return jsonify({"error": "Unauthorised"}), 403

    a.current_lat = lat
    a.current_lng = lng
    a.location_updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Location updated"}), 200