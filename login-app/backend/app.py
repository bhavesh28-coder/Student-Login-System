"""
Flask + MongoDB backend for the Login App.

Endpoints
---------
POST /api/register   -> create a new user (username, password, state, city)
POST /api/login       -> authenticate a user, returns a JWT
GET  /api/profile     -> return the logged-in user's profile (requires JWT)
GET  /api/health      -> simple health check

Run with:
    python app.py
"""

import os
import re
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "login_app")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "users")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")
JWT_EXPIRY_HOURS = 24

app = Flask(__name__)
CORS(app, origins=[CORS_ORIGIN])

# --- Database setup -------------------------------------------------------

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB_NAME]
users_collection = db[MONGO_COLLECTION]
# Enforce unique usernames at the database level
users_collection.create_index("username", unique=True)


def check_db_connection():
    try:
        client.admin.command("ping")
        return True
    except ConnectionFailure:
        return False


# --- Helpers ---------------------------------------------------------------

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.]{3,30}$")


def hash_password(plain_password: str) -> bytes:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())


def verify_password(plain_password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed)


def generate_token(username: str) -> str:
    payload = {
        "sub": username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    """Decorator that validates the Bearer JWT on protected routes."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        request.current_username = payload["sub"]
        return f(*args, **kwargs)

    return decorated


# --- Routes ------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database_connected": check_db_connection()})


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    state = (data.get("state") or "").strip()
    city = (data.get("city") or "").strip()

    # --- Validation ---
    if not username or not password or not state or not city:
        return jsonify({"error": "username, password, state and city are all required"}), 400

    if not USERNAME_RE.match(username):
        return jsonify({
            "error": "Username must be 3-30 characters and contain only letters, numbers, '.' or '_'"
        }), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "That username is already taken"}), 409

    user_doc = {
        "username": username,
        "password_hash": hash_password(password),
        "state": state,
        "city": city,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        users_collection.insert_one(user_doc)
    except DuplicateKeyError:
        return jsonify({"error": "That username is already taken"}), 409

    return jsonify({"message": "Account created successfully. You can now log in."}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = users_collection.find_one({"username": username})
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid username or password"}), 401

    token = generate_token(username)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "username": user["username"],
            "state": user["state"],
            "city": user["city"],
        },
    })


@app.route("/api/profile", methods=["GET"])
@token_required
def profile():
    user = users_collection.find_one({"username": request.current_username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "username": user["username"],
        "state": user["state"],
        "city": user["city"],
        "created_at": user["created_at"].isoformat(),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
