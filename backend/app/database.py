import os

from dotenv import load_dotenv
from pymongo import MongoClient

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "pricepilot")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured")

client = MongoClient(MONGODB_URI)

db = client[MONGODB_DATABASE]

users_collection = db["users"]