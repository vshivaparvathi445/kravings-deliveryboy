

from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Earning, Payout, DeliveryBoy, DeliveryAssignment

earnings_bp = Blueprint("earnings", __name__)


def _rider():
    return DeliveryBoy.query.get_or_404(int(get_jwt_identity()))


# ── SUMMARY ──────────────────────────────────────────────────
@earnings_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    boy    = _rider()
    period = request.args.get("period", "week")   # week | month

    today = date.today()
    if period == "week":
        start = today - timedelta(days=today.weekday())   # Monday
    elif period == "month":
        start = today.replace(day=1)
    else:
        start = today

    rows = db.session.query(
        Earning.earn_type,
        func.sum(Earning.amount).label("total")
    ).filter(
        Earning.delivery_boy_id == boy.id,
        Earning.earn_date        >= start,
        Earning.earn_date        <= today,
    ).group_by(Earning.earn_type).all()

    breakdown = {r.earn_type: float(r.total) for r in rows}
    grand     = sum(breakdown.values())

    # order count for period
    orders_count = DeliveryAssignment.query.filter(
        DeliveryAssignment.delivery_boy_id == boy.id,
        DeliveryAssignment.status          == "delivered",
        db.func.date(DeliveryAssignment.delivered_at) >= start,
        db.func.date(DeliveryAssignment.delivered_at) <= today,
    ).count()

    return jsonify({
        "period":          period,
        "period_start":    start.isoformat(),
        "period_end":      today.isoformat(),
        "grand_total":     grand,
        "breakdown":       breakdown,
        "orders_count":    orders_count,
        "avg_per_order":   round(grand / orders_count, 2) if orders_count else 0,
    }), 200


# ── DAILY BREAKDOWN ──────────────────────────────────────────
@earnings_bp.route("/daily", methods=["GET"])
@jwt_required()
def daily():
    boy  = _rider()
    days = request.args.get("days", 7, type=int)

    today  = date.today()
    result = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        total = db.session.query(func.sum(Earning.amount)).filter(
            Earning.delivery_boy_id == boy.id,
            Earning.earn_date        == d,
        ).scalar()
        count = DeliveryAssignment.query.filter(
            DeliveryAssignment.delivery_boy_id == boy.id,
            DeliveryAssignment.status          == "delivered",
            db.func.date(DeliveryAssignment.delivered_at) == d,
        ).count()
        result.append({
            "date":      d.isoformat(),
            "earnings":  float(total or 0),
            "deliveries": count,
        })

    return jsonify({"daily": result}), 200


# ── PAYOUTS ──────────────────────────────────────────────────
@earnings_bp.route("/payouts", methods=["GET"])
@jwt_required()
def payouts():
    boy  = _rider()
    page = request.args.get("page", 1, type=int)
    pp   = request.args.get("per_page", 10, type=int)

    pg = Payout.query.filter_by(delivery_boy_id=boy.id)\
               .order_by(Payout.created_at.desc())\
               .paginate(page=page, per_page=pp, error_out=False)

    return jsonify({
        "payouts": [p.to_dict() for p in pg.items],
        "total":   pg.total,
        "pages":   pg.pages,
    }), 200