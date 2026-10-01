

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, jwt, mail
import traceback



def create_app():

    app = Flask(__name__)

   
    app.config.from_object(Config)

    
    CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    },
    supports_credentials=False,
    allow_headers=[
        "Content-Type",
        "Authorization"
    ],
    methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ]
)

    # -------------------------------------------------
    # Initialize extensions
    # -------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # -------------------------------------------------
    # Import Blueprints
    # -------------------------------------------------
    from routes.auth import auth_bp
    from routes.orders import orders_bp
    from routes.earnings import earnings_bp
    from routes.profile import profile_bp
    from routes.notifications import notifs_bp
    from routes.location import location_bp
    from routes.support import support_bp

    # -------------------------------------------------
    # Register Blueprints
    # -------------------------------------------------
    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        orders_bp,
        url_prefix="/api/orders"
    )

    app.register_blueprint(
        earnings_bp,
        url_prefix="/api/earnings"
    )

    app.register_blueprint(
        profile_bp,
        url_prefix="/api/profile"
    )

    app.register_blueprint(
        notifs_bp,
        url_prefix="/api/notifications"
    )

    app.register_blueprint(
        location_bp,
        url_prefix="/api/location"
    )

    app.register_blueprint(
        support_bp,
        url_prefix="/api/support"
    )

    # -------------------------------------------------
    # Health Check
    # -------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health():

        return jsonify({
            "status": "ok",
            "service": "Kravings Delivery API v1.0"
        }), 200

    # -------------------------------------------------
    # 404 Error
    # -------------------------------------------------
    @app.errorhandler(404)
    def not_found(e):

        return jsonify({
            "error": "Not found"
        }), 404

    # -------------------------------------------------
    # 500 Error
    # -------------------------------------------------
    @app.errorhandler(500)
    def server_error(e):
        traceback.print_exc()  

        return jsonify({
            "error": "Server error"
        }), 500

    return app


# =====================================================
# START SERVER
# =====================================================

if __name__ == "__main__":

    app = create_app()

    # -------------------------------------------------
    # Create database tables
    # -------------------------------------------------
    with app.app_context():

        try:

            db.create_all()

            print("=" * 60)
            print("       KRAVINGS DELIVERY BACKEND")
            print("=" * 60)
            print("  Backend : http://127.0.0.1:5004")
            print("  Health  : http://127.0.0.1:5004/api/health")
            print("  Frontend: http://localhost:3003")
            print("=" * 60)

        except Exception as e:

            print("\n" + "=" * 60)
            print("  ERROR: Cannot connect to MySQL!")
            print("=" * 60)
            print(f"  {e}")
            print("\n  Check your .env file.")
            print("  Make sure MYSQL_PASSWORD is correct.")
            print("=" * 60 + "\n")

    # -------------------------------------------------
    # Run Flask
    # -------------------------------------------------
    app.run(
        debug=True,
        port=5004,
        host="0.0.0.0"
    )