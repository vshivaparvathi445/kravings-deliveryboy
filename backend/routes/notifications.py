"""
Notifications Routes
GET  /api/notifications/         – list notifications
PUT  /api/notifications/<id>/read
PUT  /api/notifications/read-all
DELETE /api/notifications/<id>
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Notification, DeliveryBoy

notifs_bp = Blueprint("notifications", __name__)


def _rider_id():
    return int(get_jwt_identity())


@notifs_bp.route("/", methods=["GET"])
@jwt_required()
def list_notifs():
    page     = request.args.get("page", 1, type=int)
    unread   = request.args.get("unread_only", "false").lower() == "true"
    rid      = _rider_id()

    q = Notification.query.filter_by(delivery_boy_id=rid)
    if unread:
        q = q.filter_by(is_read=False)
    pg = q.order_by(Notification.created_at.desc()).paginate(
             page=page, per_page=20, error_out=False)

    unread_count = Notification.query.filter_by(
                       delivery_boy_id=rid, is_read=False).count()

    return jsonify({
        "notifications": [n.to_dict() for n in pg.items],
        "unread_count":  unread_count,
        "total":         pg.total,
    }), 200


@notifs_bp.route("/<int:nid>/read", methods=["PUT"])
@jwt_required()
def mark_read(nid):
    n = Notification.query.get_or_404(nid)
    if n.delivery_boy_id != _rider_id():
        return jsonify({"error": "Unauthorised"}), 403
    n.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@notifs_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def read_all():
    Notification.query.filter_by(
        delivery_boy_id=_rider_id(), is_read=False
    ).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200


@notifs_bp.route("/<int:nid>", methods=["DELETE"])
@jwt_required()
def delete_notif(nid):
    n = Notification.query.get_or_404(nid)
    if n.delivery_boy_id != _rider_id():
        return jsonify({"error": "Unauthorised"}), 403
    db.session.delete(n)
    db.session.commit()
    return jsonify({"message": "Notification deleted"}), 200
