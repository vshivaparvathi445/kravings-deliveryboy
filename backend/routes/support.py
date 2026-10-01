from flask import Blueprint, request, jsonify
from datetime import datetime

from extensions import db
from models import SupportMessage, DeliveryBoy
from flask_jwt_extended import jwt_required, get_jwt_identity

support_bp = Blueprint(
    "support",
    __name__,
    url_prefix="/api/support"
)


# =========================================================
# DELIVERY BOY SEND SUPPORT MESSAGE
# =========================================================

@support_bp.route("/message", methods=["POST"])
@jwt_required()
def send_support_message():
    data = request.get_json() or {}

    delivery_boy_id = int(get_jwt_identity())

    subject = data.get("subject")
    message = data.get("message")

    if not subject:
        return jsonify({
            "success": False,
            "message": "Subject is required"
        }), 400

    if not message:
        return jsonify({
            "success": False,
            "message": "Message is required"
        }), 400

    rider = db.session.get(DeliveryBoy, delivery_boy_id)

    if not rider:
        return jsonify({
            "success": False,
            "message": "Delivery boy not found"
        }), 404

    support = SupportMessage(
        delivery_boy_id=delivery_boy_id,
        subject=subject,
        message=message,
        status="open"
    )

    db.session.add(support)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Support message sent successfully",
        "data": support.to_dict()
    }), 201