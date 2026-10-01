

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import DeliveryBoy, Vehicle, BankAccount

profile_bp = Blueprint("profile", __name__)


def _rider():
    return DeliveryBoy.query.get_or_404(int(get_jwt_identity()))


# ── GET FULL PROFILE ─────────────────────────────────────────
@profile_bp.route("/", methods=["GET"])
@jwt_required()
def get_profile():
    boy  = _rider()
    data = boy.to_dict(include_private=True)
    data["vehicle"]      = boy.vehicle.to_dict()      if boy.vehicle      else None
    data["bank_account"] = boy.bank_account.to_dict() if boy.bank_account else None
    data["documents"]    = [d.to_dict() for d in boy.documents]
    return jsonify(data), 200


# ── UPDATE PERSONAL INFO ─────────────────────────────────────
@profile_bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():
    boy  = _rider()
    data = request.get_json(silent=True) or {}

    if data.get("first_name"): boy.first_name = data["first_name"].strip()
    if data.get("last_name"):  boy.last_name  = data["last_name"].strip()
    if data.get("city"):       boy.city       = data["city"].strip()

    # password change
    if data.get("new_password"):
        if not data.get("current_password"):
            return jsonify({"error": "current_password required"}), 400
        if not check_password_hash(boy.password_hash, data["current_password"]):
            return jsonify({"error": "Current password is wrong"}), 400
        if len(data["new_password"]) < 8:
            return jsonify({"error": "New password must be 8+ characters"}), 400
        boy.password_hash = generate_password_hash(data["new_password"])

    db.session.commit()
    return jsonify({"message": "Profile updated", "rider": boy.to_dict()}), 200


# ── UPDATE VEHICLE ───────────────────────────────────────────
@profile_bp.route("/vehicle", methods=["PUT"])
@jwt_required()
def update_vehicle():
    boy  = _rider()
    data = request.get_json(silent=True) or {}

    v = boy.vehicle
    if not v:
        v = Vehicle(delivery_boy_id=boy.id)
        db.session.add(v)

    if data.get("vehicle_type"): v.vehicle_type = data["vehicle_type"]
    if data.get("brand_model"):  v.brand_model  = data["brand_model"]
    if data.get("reg_number"):   v.reg_number   = data["reg_number"].upper()
    if data.get("year"):         v.year         = data["year"]
    if data.get("color"):        v.color        = data["color"]

    db.session.commit()
    return jsonify({"message": "Vehicle updated", "vehicle": v.to_dict()}), 200


# ── UPDATE BANK ACCOUNT ──────────────────────────────────────
@profile_bp.route("/bank", methods=["PUT"])
@jwt_required()
def update_bank():
    boy  = _rider()
    data = request.get_json(silent=True) or {}

    b = boy.bank_account
    if not b:
        b = BankAccount(delivery_boy_id=boy.id,
                        account_number="", ifsc_code="")
        db.session.add(b)

    if data.get("account_number"): b.account_number = data["account_number"]
    if data.get("ifsc_code"):      b.ifsc_code      = data["ifsc_code"].upper()
    if data.get("bank_name"):      b.bank_name      = data["bank_name"]

    b.account_holder = boy.full_name()
    b.verified       = False   # needs re-verification after change

    db.session.commit()
    return jsonify({"message": "Bank account updated", "bank": b.to_dict()}), 200


# ── TOGGLE ONLINE / OFFLINE ──────────────────────────────────
@profile_bp.route("/toggle-online", methods=["PUT"])
@jwt_required()
def toggle_online():
    boy = _rider()
    if boy.status != "active":
        return jsonify({"error": "Account not active. Contact support."}), 403

    boy.is_online = not boy.is_online
    db.session.commit()
    state = "online" if boy.is_online else "offline"
    return jsonify({"message": f"You are now {state}", "is_online": boy.is_online}), 200


# ── PERFORMANCE ──────────────────────────────────────────────
@profile_bp.route("/performance", methods=["GET"])
@jwt_required()
def performance():
    boy = _rider()
    from models import DeliveryAssignment, Rating
    from sqlalchemy import func

    total     = DeliveryAssignment.query.filter_by(delivery_boy_id=boy.id).count()
    delivered = DeliveryAssignment.query.filter_by(delivery_boy_id=boy.id, status="delivered").count()
    cancelled = DeliveryAssignment.query.filter_by(delivery_boy_id=boy.id, status="cancelled").count()

    avg_rating = db.session.query(func.avg(Rating.stars)).filter_by(
                     delivery_boy_id=boy.id).scalar()

    return jsonify({
        "total_orders":      total,
        "delivered":         delivered,
        "cancelled":         cancelled,
        "completion_rate":   round(delivered / total * 100, 1) if total else 0,
        "acceptance_rate":   float(boy.acceptance_rate or 0),
        "avg_rating":        round(float(avg_rating or 0), 2),
        "total_deliveries":  boy.total_deliveries,
    }), 200