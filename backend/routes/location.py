"""
Location Routes
POST /api/location/update   – rider pushes GPS coordinates
GET  /api/location/<order_id> – admin/customer polls rider location
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import LocationLog, DeliveryBoy

location_bp = Blueprint("location", __name__)


@location_bp.route("/update", methods=["POST"])
@jwt_required()
def update_location():
    data = request.get_json(silent=True) or {}
    lat  = data.get("latitude")
    lng  = data.get("longitude")

    if lat is None or lng is None:
        return jsonify({"error": "latitude and longitude are required"}), 400

    log = LocationLog(
        delivery_boy_id = int(get_jwt_identity()),
        order_id        = data.get("order_id"),
        latitude        = lat,
        longitude       = lng,
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({"message": "Location updated"}), 200


@location_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_rider_location(order_id):
    from models import Order
    o = Order.query.get_or_404(order_id)
    if not o.delivery_boy_id:
        return jsonify({"error": "No rider assigned"}), 404

    log = LocationLog.query.filter_by(
              delivery_boy_id=o.delivery_boy_id,
              order_id=order_id
          ).order_by(LocationLog.logged_at.desc()).first()

    if not log:
        return jsonify({"error": "No location data yet"}), 404

    return jsonify({
        "latitude":   float(log.latitude),
        "longitude":  float(log.longitude),
        "updated_at": log.logged_at.isoformat(),
    }), 200
