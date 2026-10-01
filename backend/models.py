from extensions import db
from datetime import datetime
import json


class Customer(db.Model):
    __tablename__ = "customer"

    customer_id   = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    phone_no      = db.Column(db.String(15))


class DeliveryBoy(db.Model):
    __tablename__ = "delivery_boys"

    id               = db.Column(db.Integer, primary_key=True)
    first_name       = db.Column(db.String(80),  nullable=False)
    last_name        = db.Column(db.String(80),  nullable=False)
    email            = db.Column(db.String(150), nullable=False, unique=True)
    mobile           = db.Column(db.String(15),  nullable=False, unique=True)
    password_hash    = db.Column(db.String(256), nullable=False)
    city             = db.Column(db.String(80))
    dob              = db.Column(db.Date)
    profile_photo    = db.Column(db.String(255))
    partner_id       = db.Column(db.String(20),  unique=True)
    status           = db.Column(db.Enum("pending","active","suspended","rejected"),
                                 default="pending")
    is_online        = db.Column(db.Boolean, default=False)
    rating           = db.Column(db.Numeric(3,2), default=0.00)
    total_deliveries = db.Column(db.Integer, default=0)
    acceptance_rate  = db.Column(db.Numeric(5,2), default=0.00)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow,
                                 onupdate=datetime.utcnow)

    # relationships
    vehicle       = db.relationship("Vehicle",             backref="rider", uselist=False, cascade="all,delete")
    bank_account  = db.relationship("BankAccount",         backref="rider", uselist=False, cascade="all,delete")
    documents     = db.relationship("Document",            backref="rider", cascade="all,delete")
    assignments   = db.relationship("DeliveryAssignment",  backref="rider")
    earnings      = db.relationship("Earning",             backref="rider", cascade="all,delete")
    payouts       = db.relationship("Payout",              backref="rider", cascade="all,delete")
    notifications = db.relationship("Notification",        backref="rider", cascade="all,delete")

    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self, include_private=False):
        d = {
            "id":               self.id,
            "partner_id":       self.partner_id,
            "full_name":        self.full_name(),
            "email":            self.email,
            "mobile":           self.mobile,
            "city":             self.city,
            "profile_photo":    self.profile_photo,
            "status":           self.status,
            "is_online":        self.is_online,
            "rating":           float(self.rating or 0),
            "total_deliveries": self.total_deliveries,
            "acceptance_rate":  float(self.acceptance_rate or 0),
            "created_at":       self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            d["dob"] = self.dob.isoformat() if self.dob else None
        return d


class Vehicle(db.Model):
    __tablename__ = "vehicles"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    vehicle_type    = db.Column(db.Enum("bike","scooter","bicycle","ev"), default="bike")
    brand_model     = db.Column(db.String(120))
    reg_number      = db.Column(db.String(30), unique=True)
    year            = db.Column(db.SmallInteger)
    color           = db.Column(db.String(60))

    def to_dict(self):
        return {
            "id":           self.id,
            "vehicle_type": self.vehicle_type,
            "brand_model":  self.brand_model,
            "reg_number":   self.reg_number,
            "year":         self.year,
            "color":        self.color,
        }


class BankAccount(db.Model):
    __tablename__ = "bank_accounts"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False, unique=True)
    account_number  = db.Column(db.String(30), nullable=False)
    ifsc_code       = db.Column(db.String(15), nullable=False)
    bank_name       = db.Column(db.String(100))
    account_holder  = db.Column(db.String(150))
    verified        = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id":             self.id,
            "account_number": "xxxx" + self.account_number[-4:],   # masked
            "ifsc_code":      self.ifsc_code,
            "bank_name":      self.bank_name,
            "account_holder": self.account_holder,
            "verified":       self.verified,
        }


class Document(db.Model):
    __tablename__ = "documents"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    doc_type        = db.Column(db.Enum(
                          "driving_licence","rc_book","insurance",
                          "aadhaar","pan","selfie"), nullable=False)
    file_path       = db.Column(db.String(255))
    status          = db.Column(db.Enum("pending","verified","rejected","expired"), default="pending")
    expiry_date     = db.Column(db.Date)
    uploaded_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "doc_type":    self.doc_type,
            "status":      self.status,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "uploaded_at": self.uploaded_at.isoformat(),
        }


class OTPStore(db.Model):
    __tablename__ = "otp_store"

    id         = db.Column(db.Integer, primary_key=True)
    mobile     = db.Column(db.String(15), nullable=False)
    otp_code   = db.Column(db.String(10), nullable=False)
    purpose    = db.Column(db.Enum("register","forgot_password","login"), default="login")
    expires_at = db.Column(db.DateTime, nullable=False)
    used       = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────
# CUSTOMER-WEBSITE TABLES (read-mostly references)
# DO NOT change these table structures from here — they are
# owned by the customer website codebase. We only map the
# columns we need to read.
# ─────────────────────────────────────────────────────────────

class CustomerOrder(db.Model):
    __tablename__ = "orders"

    id               = db.Column(db.Integer, primary_key=True)
    order_number     = db.Column(db.String(20), unique=True)
    order_id         = db.Column(db.Integer, nullable=False)
    user_id          = db.Column(db.Integer)
    vendor_id        = db.Column(db.Integer)
    food_id          = db.Column(db.Integer)
    quantity         = db.Column(db.Integer)
    total_amount     = db.Column(db.Integer)
    status           = db.Column(db.String(50), default="pending")
    payment_method   = db.Column(db.String(50))
    payment_status   = db.Column(db.String(30), default="Pending")
    delivery_address = db.Column(db.Text)
    delivery_slot    = db.Column(db.String(100))
    created_at       = db.Column(db.DateTime)


class User(db.Model):
    __tablename__ = "users"

    id        = db.Column(db.Integer, primary_key=True)
    name      = db.Column(db.String(100))
    email     = db.Column(db.String(100))
    role      = db.Column(db.Enum("admin","vendor","customer"))
    status    = db.Column(db.Enum("active","blocked"), default="active")
    mobile_no = db.Column(db.String(15))


class Vendor(db.Model):
    __tablename__ = "vendor"

    vendor_id  = db.Column(db.Integer, primary_key=True)
    shop_name  = db.Column(db.String(100))
    owner_name = db.Column(db.String(100))
    location   = db.Column(db.String(100))
    phone      = db.Column(db.String(15))
    address    = db.Column(db.Text)
    latitude   = db.Column(db.String(50))
    longitude  = db.Column(db.String(50))
    city       = db.Column(db.String(50))


# ─────────────────────────────────────────────────────────────
# DELIVERY MODULE'S OWN TABLE
# ─────────────────────────────────────────────────────────────

class DeliveryAssignment(db.Model):
    """
    Delivery-boy-specific data for a customer order.
    One row per order once it enters the delivery pipeline.
    """
    __tablename__ = "delivery_assignments"

    id              = db.Column(db.Integer, primary_key=True)
    order_id        = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, unique=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"))

    pickup_lat      = db.Column(db.Numeric(10,7))
    pickup_lng      = db.Column(db.Numeric(10,7))
    drop_lat        = db.Column(db.Numeric(10,7))
    drop_lng        = db.Column(db.Numeric(10,7))

    distance_km     = db.Column(db.Numeric(6,2))
    estimated_time  = db.Column(db.String(20))

    base_earn       = db.Column(db.Numeric(8,2), default=0)
    bonus_earn      = db.Column(db.Numeric(8,2), default=0)
    tip             = db.Column(db.Numeric(8,2), default=0)
    total_earn      = db.Column(db.Numeric(8,2), default=0)

    otp_code        = db.Column(db.String(10))
    status          = db.Column(db.Enum("new","assigned","picked","delivered","cancelled"),
                                default="new")

    assigned_at     = db.Column(db.DateTime)
    picked_at       = db.Column(db.DateTime)
    delivered_at    = db.Column(db.DateTime)
    cancelled_at    = db.Column(db.DateTime)
    cancel_reason   = db.Column(db.String(255))
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    ratings  = db.relationship("Rating",  backref="assignment", cascade="all,delete")
    earnings = db.relationship("Earning", backref="assignment")

    # read-only convenience accessor to the linked customer order row
    def get_order(self):
        return db.session.get(CustomerOrder, self.order_id)

    def to_dict(self):
        o = self.get_order()

        customer_name  = None
        customer_phone = None
        pickup_address = None
        vendor         = None

        if o:
            if o.user_id:
                customer = db.session.get(Customer, o.user_id)
                if customer:
                    customer_name  = customer.customer_name
                    customer_phone = customer.phone_no
            if o.vendor_id:
                vendor = db.session.get(Vendor, o.vendor_id)
                if vendor:
                    pickup_address = vendor.address

        # prefer our own stored pickup_lat/lng; fall back to the vendor's
        # coordinates if we haven't stored one yet (e.g. before geocoding)
        if self.pickup_lat is not None:
            pickup_lat_val = float(self.pickup_lat)
        elif vendor and vendor.latitude:
            try:
                pickup_lat_val = float(vendor.latitude)
            except (TypeError, ValueError):
                pickup_lat_val = None
        else:
            pickup_lat_val = None

        if self.pickup_lng is not None:
            pickup_lng_val = float(self.pickup_lng)
        elif vendor and vendor.longitude:
            try:
                pickup_lng_val = float(vendor.longitude)
            except (TypeError, ValueError):
                pickup_lng_val = None
        else:
            pickup_lng_val = None

        return {
            "id":             self.id,
            "order_id":       self.order_id,
            "order_number":   o.order_id if o else None,   # ఇదే అసలు కస్టమర్ చూసే నంబర్
            "customer_name":  customer_name,
            "customer_phone": customer_phone,
            "pickup_address": pickup_address,
            "drop_address":   o.delivery_address if o else None,
            "pickup_lat":     pickup_lat_val,
            "pickup_lng":     pickup_lng_val,
            "drop_lat":       float(self.drop_lat)   if self.drop_lat  else None,
            "drop_lng":       float(self.drop_lng)   if self.drop_lng  else None,
            "item_count":     o.quantity if o else None,
            "distance_km":    float(self.distance_km) if self.distance_km else None,
            "estimated_time": self.estimated_time,
            "base_earn":      float(self.base_earn),
            "bonus_earn":     float(self.bonus_earn),
            "tip":            float(self.tip),
            "total_earn":     float(self.total_earn),
            "otp_code":       self.otp_code if self.status == "picked" else None,
            "status":         self.status,
            "assigned_at":    self.assigned_at.isoformat()   if self.assigned_at   else None,
            "picked_at":      self.picked_at.isoformat()     if self.picked_at     else None,
            "delivered_at":   self.delivered_at.isoformat()  if self.delivered_at  else None,
            "created_at":     self.created_at.isoformat()    if self.created_at    else None,
        }


class Earning(db.Model):
    __tablename__ = "earnings"

    id                    = db.Column(db.Integer, primary_key=True)
    delivery_boy_id       = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    assignment_id         = db.Column(db.Integer, db.ForeignKey("delivery_assignments.id"))
    earn_type             = db.Column(db.Enum("delivery","bonus","tip","penalty","payout"), nullable=False)
    amount                = db.Column(db.Numeric(10,2), nullable=False)
    description           = db.Column(db.String(255))
    earn_date             = db.Column(db.Date, nullable=False)
    created_at            = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "earn_type":   self.earn_type,
            "amount":      float(self.amount),
            "description": self.description,
            "earn_date":   self.earn_date.isoformat(),
        }


class Payout(db.Model):
    __tablename__ = "payouts"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    amount          = db.Column(db.Numeric(10,2), nullable=False)
    period_start    = db.Column(db.Date, nullable=False)
    period_end      = db.Column(db.Date, nullable=False)
    status          = db.Column(db.Enum("pending","processing","paid","failed"), default="pending")
    utr_number      = db.Column(db.String(50))
    paid_at         = db.Column(db.DateTime)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "amount":       float(self.amount),
            "period_start": self.period_start.isoformat(),
            "period_end":   self.period_end.isoformat(),
            "status":       self.status,
            "utr_number":   self.utr_number,
            "paid_at":      self.paid_at.isoformat() if self.paid_at else None,
            "created_at":   self.created_at.isoformat(),
        }


class Rating(db.Model):
    __tablename__ = "ratings"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    assignment_id   = db.Column(db.Integer, db.ForeignKey("delivery_assignments.id"), nullable=False)
    stars           = db.Column(db.SmallInteger, nullable=False)
    review          = db.Column(db.Text)
    rated_at        = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":       self.id,
            "stars":    self.stars,
            "review":   self.review,
            "rated_at": self.rated_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    title           = db.Column(db.String(150), nullable=False)
    body            = db.Column(db.Text)
    notif_type      = db.Column(db.Enum("order","payment","system","alert"), default="system")
    is_read         = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "title":      self.title,
            "body":       self.body,
            "notif_type": self.notif_type,
            "is_read":    self.is_read,
            "created_at": self.created_at.isoformat(),
        }


class LocationLog(db.Model):
    __tablename__ = "location_logs"

    id              = db.Column(db.Integer, primary_key=True)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    order_id        = db.Column(db.Integer)
    rejected_at     = db.Column(db.DateTime, default=datetime.utcnow)
    latitude        = db.Column(db.Numeric(10,7), nullable=False)
    longitude       = db.Column(db.Numeric(10,7), nullable=False)
    logged_at       = db.Column(db.DateTime, default=datetime.utcnow)
    current_lat          = db.Column(db.Numeric(10, 7))
    current_lng          = db.Column(db.Numeric(10, 7))
    location_updated_at  = db.Column(db.DateTime)
    

class OrderRejection(db.Model):
    __tablename__ = "order_rejections"
    id              = db.Column(db.Integer, primary_key=True)
    order_id        = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    delivery_boy_id = db.Column(db.Integer, db.ForeignKey("delivery_boys.id"), nullable=False)
    rejected_at     = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("order_id", "delivery_boy_id"),)



class SupportMessage(db.Model):
    __tablename__ = "support_messages"

    id = db.Column(db.Integer, primary_key=True)

    delivery_boy_id = db.Column(
        db.Integer,
        db.ForeignKey("delivery_boys.id"),
        nullable=False
    )

    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)

    reply = db.Column(db.Text)

    status = db.Column(
        db.Enum("open", "replied", "closed"),
        default="open"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    replied_at = db.Column(db.DateTime)

    delivery_boy = db.relationship(
        "DeliveryBoy",
        backref=db.backref("support_messages", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "delivery_boy_id": self.delivery_boy_id,
            "delivery_boy_name": (
                self.delivery_boy.full_name()
                if self.delivery_boy else None
            ),
            "subject": self.subject,
            "message": self.message,
            "reply": self.reply,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "replied_at": (
                self.replied_at.isoformat()
                if self.replied_at else None
            )
        }