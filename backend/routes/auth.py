"""
Auth Routes
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
"""

import os, random, string
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from extensions import db, mail
from models import DeliveryBoy, Vehicle, BankAccount, Document, OTPStore
from flask_mail import Message

auth_bp = Blueprint("auth", __name__)

# ── helpers ─────────────────────────────────────────────────
def allowed_file(filename):
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", {"png","jpg","jpeg","pdf"})
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed

def save_file(file, subfolder="docs"):
    filename = secure_filename(file.filename)
    folder   = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    file.save(path)
    return f"/uploads/{subfolder}/{filename}"

def generate_partner_id():
    year  = datetime.utcnow().year
    count = DeliveryBoy.query.count() + 1
    return f"DB-{year}-{count:03d}"

def generate_otp(length=6):
    return "".join(random.choices(string.digits, k=length))

def send_otp_mail(email, otp, purpose="OTP"):
    try:
        msg = Message(
            subject=f"Kravings – Your {purpose} OTP",
            recipients=[email],
            body=f"Your Kravings OTP is: {otp}\nValid for 10 minutes. Do not share with anyone."
        )
        mail.send(msg)
    except Exception as e:
        current_app.logger.warning(f"Mail send failed: {e}")


# ── REGISTER (Step 1 — personal info) ───────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    required = ["first_name", "last_name", "email", "mobile", "password", "city"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # duplicate checks
    if DeliveryBoy.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409
    if DeliveryBoy.query.filter_by(mobile=data["mobile"]).first():
        return jsonify({"error": "Mobile number already registered"}), 409

    boy = DeliveryBoy(
        first_name    = data["first_name"].strip(),
        last_name     = data["last_name"].strip(),
        email         = data["email"].strip().lower(),
        mobile        = data["mobile"].strip(),
        password_hash = generate_password_hash(data["password"]),
        city          = data.get("city","").strip(),
        dob           = datetime.strptime(data["dob"], "%Y-%m-%d").date()
                        if data.get("dob") else None,
        partner_id    = generate_partner_id(),
        status        = "pending",
    )
    try:
        db.session.add(boy)
        db.session.flush()   # get boy.id before committing

        # vehicle
        if data.get("vehicle_type"):
            v = Vehicle(
                delivery_boy_id = boy.id,
                vehicle_type    = data.get("vehicle_type","bike"),
                brand_model     = data.get("brand_model",""),
                reg_number      = data.get("reg_number","") or None,
                year            = data.get("year") or None,
                color           = data.get("color",""),
            )
            db.session.add(v)

        # bank account
        if data.get("account_number"):
            b = BankAccount(
                delivery_boy_id = boy.id,
                account_number  = data["account_number"],
                ifsc_code       = data.get("ifsc_code",""),
                bank_name       = data.get("bank_name",""),
                account_holder  = boy.full_name(),
            )
            db.session.add(b)

        db.session.commit()
    except Exception as db_err:
        db.session.rollback()
        current_app.logger.error(f"Register DB error: {db_err}")
        return jsonify({"error": f"Database error: {str(db_err)}"}), 500

    access  = create_access_token(identity=str(boy.id))
    refresh = create_refresh_token(identity=str(boy.id))

    return jsonify({
        "message":       "Registration successful. Documents pending verification.",
        "partner_id":    boy.partner_id,
        "access_token":  access,
        "refresh_token": refresh,
        "rider":         boy.to_dict(),
    }), 201


# ── UPLOAD DOCUMENT ─────────────────────────────────────────
@auth_bp.route("/upload-doc", methods=["POST"])
@jwt_required()
def upload_doc():
    rider_id = int(get_jwt_identity())
    doc_type = request.form.get("doc_type")
    file     = request.files.get("file")

    valid_types = ["driving_licence","rc_book","insurance","aadhaar","pan","selfie"]
    if doc_type not in valid_types:
        return jsonify({"error": "Invalid doc_type"}), 400
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file. Allowed: png, jpg, jpeg, pdf"}), 400

    path = save_file(file, subfolder=f"docs/{rider_id}")

    # upsert
    doc = Document.query.filter_by(delivery_boy_id=rider_id, doc_type=doc_type).first()
    if doc:
        doc.file_path    = path
        doc.status       = "pending"
        doc.uploaded_at  = datetime.utcnow()
    else:
        doc = Document(delivery_boy_id=rider_id, doc_type=doc_type,
                       file_path=path, status="pending")
        db.session.add(doc)

    db.session.commit()
    return jsonify({"message": f"{doc_type} uploaded", "file_path": path}), 200


# ── LOGIN ────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier", "").strip()   # email or mobile
    password   = data.get("password",   "").strip()

    if not identifier or not password:
        return jsonify({"error": "Identifier and password are required"}), 400

    boy = (DeliveryBoy.query.filter_by(email=identifier).first() or
           DeliveryBoy.query.filter_by(mobile=identifier).first())

    if not boy or not check_password_hash(boy.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    if boy.status == "suspended":
        return jsonify({"error": "Account suspended. Contact support."}), 403
    if boy.status == "rejected":
        return jsonify({"error": "Application rejected. Contact support."}), 403

    access  = create_access_token(identity=str(boy.id))
    refresh = create_refresh_token(identity=str(boy.id))

    return jsonify({
        "message":       "Login successful",
        "access_token":  access,
        "refresh_token": refresh,
        "rider":         boy.to_dict(include_private=True),
    }), 200


# ── REFRESH TOKEN ────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    token    = create_access_token(identity=identity)
    return jsonify({"access_token": token}), 200


# ── ME ───────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    rider_id = int(get_jwt_identity())
    boy = DeliveryBoy.query.get_or_404(rider_id)
    data = boy.to_dict(include_private=True)
    if boy.vehicle:
        data["vehicle"] = boy.vehicle.to_dict()
    if boy.bank_account:
        data["bank_account"] = boy.bank_account.to_dict()
    data["documents"] = [d.to_dict() for d in boy.documents]
    return jsonify(data), 200


# ── SEND OTP ─────────────────────────────────────────────────
@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    data    = request.get_json(silent=True) or {}
    mobile  = data.get("mobile","").strip()
    purpose = data.get("purpose","forgot_password")

    if not mobile:
        return jsonify({"error": "Mobile number required"}), 400

    boy = DeliveryBoy.query.filter_by(mobile=mobile).first()
    if not boy:
        return jsonify({"error": "Mobile number not registered"}), 404

    otp        = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # invalidate old OTPs for this mobile+purpose
    OTPStore.query.filter_by(mobile=mobile, purpose=purpose, used=False).delete()

    record = OTPStore(mobile=mobile, otp_code=otp,
                      purpose=purpose, expires_at=expires_at)
    db.session.add(record)
    db.session.commit()

    send_otp_mail(boy.email, otp, purpose="Password Reset")

    # In production, also trigger SMS here via Twilio / MSG91
    current_app.logger.info(f"OTP for {mobile}: {otp}")   # dev only

    return jsonify({"message": "OTP sent successfully", "dev_otp": otp}), 200


# ── VERIFY OTP ───────────────────────────────────────────────
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data    = request.get_json(silent=True) or {}
    mobile  = data.get("mobile","").strip()
    otp     = data.get("otp","").strip()
    purpose = data.get("purpose","forgot_password")

    record = OTPStore.query.filter_by(
        mobile=mobile, otp_code=otp, purpose=purpose, used=False
    ).order_by(OTPStore.created_at.desc()).first()

    if not record:
        return jsonify({"error": "Invalid OTP"}), 400
    if record.expires_at < datetime.utcnow():
        return jsonify({"error": "OTP expired. Request a new one."}), 400

    record.used = True
    db.session.commit()
    return jsonify({"message": "OTP verified", "verified": True}), 200


# ── RESET PASSWORD ───────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data     = request.get_json(silent=True) or {}
    mobile   = data.get("mobile","").strip()
    otp      = data.get("otp","").strip()
    new_pass = data.get("new_password","").strip()

    if not all([mobile, otp, new_pass]):
        return jsonify({"error": "mobile, otp and new_password are required"}), 400
    if len(new_pass) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    record = OTPStore.query.filter_by(
        mobile=mobile, otp_code=otp, purpose="forgot_password", used=False
    ).order_by(OTPStore.created_at.desc()).first()

    if not record or record.expires_at < datetime.utcnow():
        return jsonify({"error": "Invalid or expired OTP"}), 400

    boy = DeliveryBoy.query.filter_by(mobile=mobile).first()
    if not boy:
        return jsonify({"error": "Account not found"}), 404

    boy.password_hash = generate_password_hash(new_pass)
    record.used       = True
    db.session.commit()

    return jsonify({"message": "Password reset successfully. Please login."}), 200


# ── LOGOUT ───────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    rider_id = int(get_jwt_identity())
    boy = DeliveryBoy.query.get(rider_id)
    if boy:
        boy.is_online = False
        db.session.commit()
    return jsonify({"message": "Logged out successfully"}), 200