#!/usr/bin/env python3
"""
Anna Sakhi — Python / FastAPI backend
Secure Gemini API proxy + Firebase Firestore database, accessible on local network.

Endpoints:
  POST /api/vision          — image analysis (key stays server-side)
  POST /api/chat            — text chat      (key stays server-side)
  GET  /api/live-key        — returns key to LOCAL NETWORK IPs only
  GET  /health              — liveness check

  # ── Database (all require Firebase ID token in Authorization header) ──
  GET/PUT  /api/db/profile              — user profile
  GET/POST /api/db/pantry               — pantry items
  DELETE   /api/db/pantry/{item_id}     — delete pantry item
  GET/POST /api/db/sessions             — chat sessions
  GET      /api/db/sessions/{sid}/messages        — messages in a session
  POST     /api/db/sessions/{sid}/messages        — add message to session
  GET/POST /api/db/recipes              — saved recipes
  DELETE   /api/db/recipes/{recipe_id}  — delete saved recipe
  POST     /api/db/scans                — save an image scan result
  GET      /api/db/scans                — list scan history

Run (dev):
  python app.py

Run (prod):
  npm run build
  python app.py --prod
"""

import argparse
import ipaddress
import os
import socket
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from google import genai
from google.genai import types

# ── Load env ────────────────────────────────────────────────
_root = Path(__file__).parent
load_dotenv(_root / "server" / ".env")
load_dotenv(_root / ".env")

API_KEY  = os.getenv("GEMINI_API_KEY", "")
PORT     = int(os.getenv("PORT", 4000))
MODEL    = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
MODELS_TO_TRY = list(dict.fromkeys([
    MODEL,
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.5-flash",
]))

# CORS allowlist — comma-separated origins in ALLOWED_ORIGINS env var.
# Defaults to localhost dev origins + production Firebase Hosting domains.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    f"http://localhost:5173,http://127.0.0.1:5173,http://localhost:{os.getenv('PORT', 4000)},http://127.0.0.1:{os.getenv('PORT', 4000)},https://anna-sakhi.web.app,https://anna-sakhi.firebaseapp.com",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Path to the Firebase service account JSON key
SA_KEY_PATH = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT",
    str(_root / "anna-sakhi-service-account.json"),
)
FIRESTORE_DB = os.getenv("FIRESTORE_DB", "anna-sakhi-db")

if not API_KEY:
    print("\n[WARNING] GEMINI_API_KEY is not set.")
    print("   Add it to server/.env - copy server/.env.example to start.\n")

# ── Firebase Admin SDK ───────────────────────────────────────
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth

_firebase_ready = False

def init_firebase():
    global _firebase_ready
    if _firebase_ready:
        return

    # 1. Check if raw JSON was provided via env var (for Render / cloud PaaS)
    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    if sa_json:
        try:
            cred_dict = json.loads(sa_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_ready = True
            print("   Firebase -> [OK] connected to Firestore via FIREBASE_SERVICE_ACCOUNT_JSON")
            return
        except Exception as e:
            print(f"   Firebase -> [ERROR] Failed to init from FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    # 2. Check local file path
    sa_path = Path(SA_KEY_PATH)
    if not sa_path.exists():
        print(f"\n[WARNING] Firebase service account key not found at: {sa_path}")
        print("   Set FIREBASE_SERVICE_ACCOUNT_JSON env var or upload anna-sakhi-service-account.json\n")
        return
    try:
        cred = credentials.Certificate(str(sa_path))
        firebase_admin.initialize_app(cred)
        _firebase_ready = True
        print("   Firebase -> [OK] connected to Firestore")
    except Exception as e:
        print(f"   Firebase -> [ERROR] init failed: {e}")

def get_db():
    """Return the Firestore client, selecting the named database."""
    if not _firebase_ready:
        raise HTTPException(status_code=503, detail="Firebase not configured. Add service account key.")
    return firestore.client(database_id=FIRESTORE_DB)

# ── Auth helper ──────────────────────────────────────────────
async def get_current_uid(request: Request) -> str:
    """Verify Firebase ID token from Authorization: Bearer <token> header."""
    if not _firebase_ready:
        raise HTTPException(status_code=503, detail="Firebase not configured.")
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    id_token = auth_header[len("Bearer "):]
    try:
        decoded = fb_auth.verify_id_token(id_token)
        return decoded["uid"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

# ── Gemini client ────────────────────────────────────────────
_client: genai.Client | None = None

def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not API_KEY:
            raise HTTPException(status_code=503, detail="Gemini API key not configured on server")
        client_kwargs = {"api_key": API_KEY}
        try:
            if hasattr(types, "HttpRetryOptions") and hasattr(types, "HttpOptions"):
                client_kwargs["http_options"] = types.HttpOptions(
                    timeout=25000,
                    retry_options=types.HttpRetryOptions(attempts=1),
                )
        except Exception:
            pass
        _client = genai.Client(**client_kwargs)
    return _client

# ── Prompts ──────────────────────────────────────────────────
SYSTEM_INSTRUCTION = (
    "You are Anna Sakhi, a warm, knowledgeable cooking companion specialising in Konkan, Malvani, Goan, and broader South Indian coastal cuisine. "
    "You speak like a trusted, thoughtful friend who cooks with experience, but you remain calm, grounded, and clear.\n\n"
    "CRITICAL TONE & FORMAT RULES:\n"
    "1. NO EMOJIS anywhere in your output.\n"
    "2. NO EXCLAMATION MARKS (!) anywhere in your output.\n"
    "3. No filler praise (avoid 'Delicious', 'Amazing choice', 'Super easy'), no slang.\n"
    "4. Tone: warm and conversational, like a friend who cooks.\n\n"
    "RECIPE STRUCTURE (MUST FOLLOW EXACTLY):\n"
    "Whenever sharing or suggesting a recipe, strictly follow this layout:\n\n"
    "[Opening]: Exactly one friendly line that speaks to the reader directly, such as 'This one is great for a weeknight when you want something bold.'\n\n"
    "**[Recipe Name]**\n"
    "Serves [X] | Prep [X] mins | Cook [X] mins\n\n"
    "### Ingredients\n"
    "Organise into lettered groups (A, B, C) with bold labels, e.g. **Group A: The Base**.\n"
    "Each bullet must start with the amount (e.g. '* 2 cups fresh grated coconut'). Add a short personal note where helpful (e.g. '* 1 tsp Malvani masala — use bone-in for more flavour' or '* 2 green chillies — reduce if you prefer mild').\n\n"
    "### Method\n"
    "Numbered steps with bold titles and indented sub-bullets.\n"
    "Every step must include a clear sensory cue, such as 'until golden and fragrant' or 'until the oil begins to leave the sides of the pan', so the cook knows what to observe.\n\n"
    "### Tweaks for you\n"
    "A short bulleted section with 2 or 3 practical options for adjusting spice, thickness, or servings.\n\n"
    "### Serving suggestions\n"
    "A short bullet list, phrased as a personal recommendation (e.g. '* I would pair this with steamed rice and a crisp sol kadhi.').\n\n"
    "### Nutrition (per serving)\n"
    "Labelled bullets per serving (Calories, Protein, Carbs, Fat), followed by a one-line estimate note.\n\n"
    "When answering general culinary questions or chatting without generating a full recipe:\n"
    "Maintain the same warm friend tone, no emojis, no exclamation marks, concise and helpful.\n"
    "CRITICAL: Never ask the user to adjust API settings or enable 'precise ingredient identification'. You are fully capable of identifying ingredients as-is."
)

IMAGE_PROMPT = """Please analyse this image carefully and respond as Anna Sakhi.

CRITICAL RULES:
1. No emojis.
2. No exclamation marks.
3. Warm, conversational tone like a friend who cooks.

Identify every visible ingredient or dish, noting estimated quantities and freshness.
If recommending a recipe for the ingredients found, structure the recipe following your standard recipe layout:
Opening line, bold title, Serves | Prep | Cook line, lettered ingredient groups, numbered steps with sensory cues, tweaks for you, serving suggestions, and nutrition estimates."""


# ── FastAPI app ──────────────────────────────────────────────
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize Firebase in the worker process
    init_firebase()
    yield
    # Shutdown (nothing to clean up)

app = FastAPI(title="Anna Sakhi API", version="2.0.0", docs_url="/api/docs", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.web\.app|.*\.firebaseapp\.com|.*\.onrender\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin", "")
    print(f"[REQ] {request.method} {request.url.path} (origin: {origin})")
    response = await call_next(request)
    print(f"[RES] {request.method} {request.url.path} -> {response.status_code}")
    return response


# ── Local IP guard ───────────────────────────────────────────
_PRIVATE = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

def is_local_ip(ip: str) -> bool:
    if not ip or ip in ("localhost", "127.0.0.1", "::1"):
        return True
    try:
        addr = ipaddress.ip_address(ip)
        return any(addr in net for net in _PRIVATE)
    except ValueError:
        return False

def get_client_ip(request: Request) -> str:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else ""


# ── Request / Response models ─────────────────────────────────
class VisionRequest(BaseModel):
    base64: str
    mimeType: str = "image/jpeg"
    userText: str = ""

class HistoryItem(BaseModel):
    role: str      # 'user' | 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[HistoryItem] = []

# DB models
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatarUrl: Optional[str] = None

class PantryItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None

class SessionCreate(BaseModel):
    title: str = "New Conversation"

class MessageCreate(BaseModel):
    role: str        # 'user' | 'assistant'
    content: str
    imageUrl: Optional[str] = None

class RecipeSave(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: Optional[List[str]] = []
    source: Optional[str] = None  # e.g. 'chat', 'scan'

class ScanSave(BaseModel):
    analysisText: str
    detectedIngredients: Optional[List[str]] = []
    imageUrl: Optional[str] = None


# ── Gemini routes ─────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "ok": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "configured": bool(API_KEY),
        "firebase": _firebase_ready,
    }


def generate_gemini_content(client, contents, system_instruction, temperature=0.7):
    last_err = None
    http_opts = None
    try:
        if hasattr(types, "HttpRetryOptions") and hasattr(types, "HttpOptions"):
            http_opts = types.HttpOptions(
                timeout=25000,
                retry_options=types.HttpRetryOptions(attempts=1),
            )
    except Exception:
        http_opts = None

    thinking_cfg = None
    try:
        if hasattr(types, "ThinkingConfig"):
            thinking_cfg = types.ThinkingConfig(thinking_budget=0)
    except Exception:
        thinking_cfg = None

    for model_name in MODELS_TO_TRY:
        try:
            cfg_kwargs = {
                "system_instruction": system_instruction,
                "temperature": temperature,
                "max_output_tokens": 1024,
            }
            if thinking_cfg:
                cfg_kwargs["thinking_config"] = thinking_cfg
            if http_opts:
                cfg_kwargs["http_options"] = http_opts

            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(**cfg_kwargs),
            )
            if response and response.text:
                return response.text
        except Exception as exc:
            print(f"[Gemini] Model '{model_name}' failed: {exc}. Trying fallback...")
            last_err = exc
    raise HTTPException(status_code=500, detail=str(last_err or "No response from Gemini models"))


@app.post("/api/vision")
async def vision(body: VisionRequest):
    client = get_client()
    prompt = (
        f"{IMAGE_PROMPT}\n\nThe user also says: \"{body.userText}\""
        if body.userText else IMAGE_PROMPT
    )
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(
                    data=__import__("base64").b64decode(body.base64),
                    mime_type=body.mimeType,
                ),
                types.Part.from_text(text=prompt),
            ],
        )
    ]
    text = generate_gemini_content(
        client=client,
        contents=contents,
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=0.7,
    )
    return {"text": text}


@app.post("/api/chat")
async def chat(body: ChatRequest):
    client = get_client()
    contents = [
        types.Content(
            role="user" if h.role == "user" else "model",
            parts=[types.Part.from_text(text=h.content)],
        )
        for h in body.history
    ] + [
        types.Content(role="user", parts=[types.Part.from_text(text=body.message)])
    ]
    text = generate_gemini_content(
        client=client,
        contents=contents,
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=0.75,
    )
    return {"text": text}


@app.get("/api/live-key")
async def live_key(request: Request):
    """Return the Gemini API key — local network IPs or authenticated Firebase users."""
    ip = get_client_ip(request)
    if not is_local_ip(ip):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            id_token = auth_header[len("Bearer "):]
            try:
                fb_auth.verify_id_token(id_token)
            except Exception:
                raise HTTPException(status_code=403, detail="Invalid token for live-key access")
        else:
            raise HTTPException(status_code=403, detail="Access restricted to local network or authenticated users")
    if not API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key not configured on server")
    return {"key": API_KEY}


# ── Database routes ───────────────────────────────────────────

# ── Profile ──────────────────────────────────────────────────
@app.get("/api/db/profile")
async def get_profile(uid: str = Depends(get_current_uid)):
    db = get_db()
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return {}
    return doc.to_dict()

@app.put("/api/db/profile")
async def update_profile(body: ProfileUpdate, uid: str = Depends(get_current_uid)):
    db = get_db()
    user_ref = db.collection("users").document(uid)
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    user_ref.set(update_data, merge=True)
    return {"ok": True}


# ── Pantry ────────────────────────────────────────────────────
@app.get("/api/db/pantry")
async def get_pantry(uid: str = Depends(get_current_uid)):
    db = get_db()
    items = db.collection("users").document(uid).collection("pantry").order_by("name").stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in items]

@app.post("/api/db/pantry")
async def add_pantry_item(body: PantryItem, uid: str = Depends(get_current_uid)):
    db = get_db()
    pantry_ref = db.collection("users").document(uid).collection("pantry")
    _, doc_ref = pantry_ref.add({
        **body.model_dump(),
        "addedAt": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": doc_ref.id, "ok": True}

@app.delete("/api/db/pantry/{item_id}")
async def delete_pantry_item(item_id: str, uid: str = Depends(get_current_uid)):
    db = get_db()
    db.collection("users").document(uid).collection("pantry").document(item_id).delete()
    return {"ok": True}


# ── Chat sessions ─────────────────────────────────────────────
@app.get("/api/db/sessions")
async def get_sessions(uid: str = Depends(get_current_uid)):
    db = get_db()
    sessions = (
        db.collection("users").document(uid).collection("sessions")
        .order_by("updatedAt", direction=firestore.Query.DESCENDING)
        .limit(50)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in sessions]

@app.post("/api/db/sessions")
async def create_session(body: SessionCreate, uid: str = Depends(get_current_uid)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    _, doc_ref = db.collection("users").document(uid).collection("sessions").add({
        "title": body.title,
        "createdAt": now,
        "updatedAt": now,
    })
    return {"id": doc_ref.id, "ok": True}

@app.get("/api/db/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    uid: str = Depends(get_current_uid),
    limit: int = 100,
):
    """Return messages for a session, newest-first, up to `limit` (default 100)."""
    db = get_db()
    messages = (
        db.collection("users").document(uid)
        .collection("sessions").document(session_id)
        .collection("messages")
        .order_by("timestamp")
        .limit(limit)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in messages]

@app.post("/api/db/sessions/{session_id}/messages")
async def add_message(session_id: str, body: MessageCreate, uid: str = Depends(get_current_uid)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    session_ref = db.collection("users").document(uid).collection("sessions").document(session_id)
    # Add message
    _, msg_ref = session_ref.collection("messages").add({
        **body.model_dump(),
        "timestamp": now,
    })
    # Update session's updatedAt
    session_ref.update({"updatedAt": now})
    return {"id": msg_ref.id, "ok": True}

@app.delete("/api/db/sessions/{session_id}")
async def delete_session(session_id: str, uid: str = Depends(get_current_uid)):
    """Delete a session and all its messages atomically using Firestore batch writes.

    Firestore batches are capped at 500 operations, so messages are chunked.
    """
    db = get_db()
    session_ref = (
        db.collection("users").document(uid).collection("sessions").document(session_id)
    )
    # Collect all message refs, then delete in chunks of 499
    # (leaving one slot in each batch for the session doc itself on the last chunk)
    msg_refs = [doc.reference for doc in session_ref.collection("messages").stream()]
    BATCH_LIMIT = 499
    for i in range(0, max(len(msg_refs), 1), BATCH_LIMIT):
        batch = db.batch()
        for ref in msg_refs[i : i + BATCH_LIMIT]:
            batch.delete(ref)
        if i + BATCH_LIMIT >= len(msg_refs):
            # Last (or only) batch — also delete the session document
            batch.delete(session_ref)
        batch.commit()
    return {"ok": True}


# ── Saved recipes ─────────────────────────────────────────────
@app.get("/api/db/recipes")
async def get_recipes(uid: str = Depends(get_current_uid)):
    db = get_db()
    recipes = (
        db.collection("users").document(uid).collection("recipes")
        .order_by("savedAt", direction=firestore.Query.DESCENDING)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in recipes]

@app.post("/api/db/recipes")
async def save_recipe(body: RecipeSave, uid: str = Depends(get_current_uid)):
    db = get_db()
    _, doc_ref = db.collection("users").document(uid).collection("recipes").add({
        **body.model_dump(),
        "savedAt": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": doc_ref.id, "ok": True}

@app.delete("/api/db/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, uid: str = Depends(get_current_uid)):
    db = get_db()
    db.collection("users").document(uid).collection("recipes").document(recipe_id).delete()
    return {"ok": True}


# ── Image scans ───────────────────────────────────────────────
@app.get("/api/db/scans")
async def get_scans(uid: str = Depends(get_current_uid)):
    db = get_db()
    scans = (
        db.collection("users").document(uid).collection("scans")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(20)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in scans]

@app.post("/api/db/scans")
async def save_scan(body: ScanSave, uid: str = Depends(get_current_uid)):
    db = get_db()
    _, doc_ref = db.collection("users").document(uid).collection("scans").add({
        **body.model_dump(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": doc_ref.id, "ok": True}


# ── Static files (production) ─────────────────────────────────
def mount_static():
    dist = _root / "dist"
    if dist.exists():
        app.mount("/", StaticFiles(directory=str(dist), html=True), name="static")
        print("   Serving static files from ./dist")
    else:
        print("   [WARNING] ./dist not found - run 'npm run build' first for production mode")


# ── Startup banner ────────────────────────────────────────────
def get_lan_ips() -> list[str]:
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            try:
                addr = ipaddress.ip_address(ip)
                if not addr.is_loopback and addr.version == 4:
                    ips.append(f"http://{ip}:{PORT}")
            except ValueError:
                pass
    except Exception:
        pass
    return list(dict.fromkeys(ips))


# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Anna Sakhi Python backend")
    parser.add_argument("--prod", action="store_true", help="Production mode — serve ./dist")
    args = parser.parse_args()
    # Note: Firebase is initialised in the `lifespan` context manager above.
    # No need to call init_firebase() here — uvicorn will trigger lifespan on startup.

    if args.prod:
        mount_static()

    lan_ips = get_lan_ips()
    print("\n[Anna Sakhi] Python server starting...\n")
    print(f"   Local   -> http://localhost:{PORT}")
    for ip in lan_ips:
        print(f"   Network -> {ip}")
    print(f"   API key -> {'[OK] configured' if API_KEY else '[MISSING] NOT SET (check server/.env)'}")
    print(f"   Mode    -> {'production' if args.prod else 'development (proxy Vite frontend)'}")
    print(f"   Docs    -> http://localhost:{PORT}/api/docs")
    print()

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        reload=not args.prod,
        log_level="info",
    )
