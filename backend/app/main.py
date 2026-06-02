from __future__ import annotations

import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.auth import create_access_token, current_user, decode_access_token, hash_password, now_iso, public_user, require_role, verify_password
from app.database import get_connection, initialize_database

HARNESS_PATH = Path(__file__).resolve().parents[2] / "demo-harness"
if HARNESS_PATH.exists() and str(HARNESS_PATH) not in sys.path:
    sys.path.insert(0, str(HARNESS_PATH))

from harness.build_prompt import ConversationTurn
from harness.providers.router import ProviderRouter
from harness.run_learning_assistant import LearningAssistantRequest, generate_learning_assistant_response

app = FastAPI(title="STOA Local Test Backend")
SUPPORTED_RESPONSE_LANGUAGES = {"en", "de", "fr", "it"}
DEFAULT_RESPONSE_LANGUAGE = "en"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(LoginRequest):
    name: str
    role: str
    preferredLanguage: str | None = None
    profile: dict[str, object] | None = None


class StudentProfileUpdate(BaseModel):
    grade: str | None = None
    primarySubjects: list[str] | None = None
    schoolSystem: str | None = None
    preferredAnswerLanguage: str | None = None


class CreateConversationRequest(BaseModel):
    subject: str = "General"
    grade: str = "Grade 8"
    initialMessage: str | None = None


class SendMessageRequest(BaseModel):
    content: str
    attachmentIds: list[str] | None = None


class UploadedFileResponse(BaseModel):
    id: str
    filename: str
    mimeType: str
    sizeBytes: int
    status: str
    createdAt: str


class TeacherHelpCreateRequest(BaseModel):
    conversationId: str
    message: str | None = None


class HelpStatusUpdate(BaseModel):
    status: str


class AnalyticsEventRequest(BaseModel):
    name: str | None = None
    eventName: str | None = None
    payload: dict[str, object] | None = None
    path: str | None = None
    sessionId: str | None = None


class TeacherNoteRequest(BaseModel):
    content: str | None = None
    note: str | None = None


class FeedbackRequest(BaseModel):
    type: str
    page: str
    message: str
    userRole: str | None = None
    createdAt: str | None = None


class CheckoutSessionRequest(BaseModel):
    plan: str
    utm: dict[str, object] | None = None


class SupportTicketCreateRequest(BaseModel):
    subject: str
    message: str
    category: str
    priority: str = "normal"
    contactEmail: str | None = None
    page: str | None = None
    userRole: str | None = None
    createdAt: str | None = None


class ContactRequest(BaseModel):
    name: str
    email: str
    phone: str | None = None
    role: str
    topic: str
    message: str
    preferredLanguage: str | None = None


class SupportTicketStatusUpdate(BaseModel):
    status: str


@app.on_event("startup")
def startup() -> None:
    initialize_database()


def demo_error_code(status_code: int, detail: object) -> str:
    if status_code == 401:
        detail_text = str(detail).lower()
        if "credential" in detail_text or "password" in detail_text or "email" in detail_text:
            return "DEMO_INVALID_CREDENTIALS"
        return "DEMO_UNAUTHORIZED"
    if status_code == 403:
        return "DEMO_FORBIDDEN"
    if status_code == 404:
        return "DEMO_NOT_FOUND"
    if status_code == 400:
        return "DEMO_VALIDATION_ERROR"
    return "DEMO_UNSUPPORTED_FLOW"


class EmailDeliveryError(RuntimeError):
    pass


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def normalize_response_language(value: object | None) -> str:
    if not isinstance(value, str):
        return DEFAULT_RESPONSE_LANGUAGE
    language = value.strip().lower()
    return language if language in SUPPORTED_RESPONSE_LANGUAGES else DEFAULT_RESPONSE_LANGUAGE


def validate_response_language(value: str | None) -> str | None:
    if value is None:
        return None
    language = value.strip().lower()
    if language not in SUPPORTED_RESPONSE_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported answer language")
    return language


def contact_email_config() -> dict[str, str | bool | int]:
    return {
        "enabled": env_bool("STOA_CONTACT_EMAIL_ENABLED", True),
        "auto_reply_enabled": env_bool("STOA_CONTACT_AUTOREPLY_ENABLED", True),
        "public_key": os.environ.get("STOA_EMAILJS_PUBLIC_KEY", "oT2sDvEzvUw-khq2T"),
        "service_id": os.environ.get("STOA_EMAILJS_SERVICE_ID", "service_stoa"),
        "notify_template_id": os.environ.get("STOA_EMAILJS_NOTIFY_TEMPLATE_ID", "template_g6tviz6"),
        "auto_reply_template_id": os.environ.get("STOA_EMAILJS_AUTOREPLY_TEMPLATE_ID", "template_9i4iphq"),
        "inbox_email": os.environ.get("STOA_CONTACT_INBOX_EMAIL", "info@stoaedu.ch"),
        "timeout_seconds": int(os.environ.get("STOA_EMAILJS_TIMEOUT_SECONDS", "10")),
    }


def email_timestamp() -> str:
    return datetime.datetime.now(datetime.timezone.utc).astimezone().strftime("%d.%m.%Y, %H:%M:%S")


def build_contact_mail_body(params: dict[str, str]) -> str:
    return (
        "[Deutsch]\n\n"
        "Sie haben eine neue Anfrage uber das Kontaktformular auf Ihrer Website erhalten:\n\n"
        f"Name: {params['from_name']}\n"
        f"E-Mail: {params['from_email']}\n"
        f"Telefon: {params['phone']}\n"
        f"Rolle: {params['role']}\n"
        f"Thema: {params['subject']}\n"
        f"Sprache: {params['preferred_language']}\n"
        f"Datum: {params['timestamp']}\n\n"
        "Nachricht:\n"
        f"{params['message']}\n\n"
        "Bitte antworten Sie dem Kunden so bald wie moglich.\n\n\n"
        "[English]\n\n"
        "You have received a new inquiry from your website contact form:\n\n"
        f"Name: {params['from_name']}\n"
        f"Email: {params['from_email']}\n"
        f"Phone: {params['phone']}\n"
        f"Role: {params['role']}\n"
        f"Topic: {params['subject']}\n"
        f"Preferred language: {params['preferred_language']}\n"
        f"Date: {params['timestamp']}\n\n"
        "Message:\n"
        f"{params['message']}\n\n"
        "Please respond to the customer as soon as possible."
    )


def send_emailjs_template(
    service_id: str,
    template_id: str,
    public_key: str,
    template_params: dict[str, str],
    timeout_seconds: int,
) -> None:
    request_body = json.dumps({
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "public_key": public_key,
        "template_params": template_params,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://api.emailjs.com/api/v1.0/email/send",
        data=request_body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            if response.status >= 400:
                raise EmailDeliveryError(f"EmailJS returned status {response.status}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise EmailDeliveryError(f"EmailJS returned status {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise EmailDeliveryError(f"EmailJS request failed: {exc.reason}") from exc
    except TimeoutError as exc:
        raise EmailDeliveryError("EmailJS request timed out") from exc


def deliver_contact_emails(payload: ContactRequest, request_id: str) -> dict[str, object]:
    config = contact_email_config()
    if not config["enabled"]:
        return {"enabled": False, "notificationSent": False, "autoReplySent": False}

    inbox_email = str(config["inbox_email"])
    template_params = {
        "from_name": payload.name.strip(),
        "from_email": payload.email.strip(),
        "phone": (payload.phone or "").strip(),
        "timestamp": email_timestamp(),
        "subject": payload.topic,
        "role": payload.role,
        "preferred_language": payload.preferredLanguage or "",
        "message": payload.message.strip(),
        "request_id": request_id,
        "reply_to": payload.email.strip(),
    }
    template_params["mail_body"] = build_contact_mail_body(template_params)

    send_emailjs_template(
        str(config["service_id"]),
        str(config["notify_template_id"]),
        str(config["public_key"]),
        {**template_params, "to_email": inbox_email},
        int(config["timeout_seconds"]),
    )

    auto_reply_sent = False
    if config["auto_reply_enabled"] and payload.email.strip().lower() != inbox_email.lower():
        send_emailjs_template(
            str(config["service_id"]),
            str(config["auto_reply_template_id"]),
            str(config["public_key"]),
            {**template_params, "to_email": payload.email.strip()},
            int(config["timeout_seconds"]),
        )
        auto_reply_sent = True

    return {"enabled": True, "notificationSent": True, "autoReplySent": auto_reply_sent}


@app.exception_handler(HTTPException)
async def demo_http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail.get("message") if isinstance(exc.detail, dict) else str(exc.detail)
    code = exc.detail.get("code") if isinstance(exc.detail, dict) else demo_error_code(exc.status_code, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"message": message, "code": code})


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "service": "stoa-demo-backend", "mode": "demo"}


@app.get("/health/provider")
def provider_health() -> dict[str, object]:
    return ProviderRouter().health()


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = public_user(row)
    return {"accessToken": create_access_token(user["id"]), "user": user}


@app.post("/auth/register")
def register(payload: RegisterRequest) -> dict[str, object]:
    if payload.role not in {"student", "parent", "tutor"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    user_id = f"user-{uuid.uuid4()}"
    created_at = now_iso()
    profile = payload.profile or {}
    with get_connection() as connection:
        try:
            connection.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, payload.name, payload.email, hash_password(payload.password), payload.role, created_at),
            )
            if payload.role == "student":
                subjects = profile.get("subjectsNeedingHelp")
                if not isinstance(subjects, list):
                    subjects = []
                preferred_language = normalize_response_language(
                    profile.get("preferredAnswerLanguage") or payload.preferredLanguage
                )
                connection.execute(
                    """
                    INSERT INTO student_profiles
                    (id, user_id, grade, school_system, primary_subjects, preferred_language, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"profile-{uuid.uuid4()}",
                        user_id,
                        str(profile.get("grade") or "Grade 8"),
                        str(profile.get("schoolSystem") or ""),
                        json.dumps(subjects),
                        preferred_language,
                        created_at,
                    ),
                )
            if payload.role == "parent":
                child_id = f"user-child-{uuid.uuid4()}"
                child_name = str(profile.get("childName") or "Demo child")
                child_grade = str(profile.get("childGrade") or "Grade 8")
                child_subjects = profile.get("subjectsNeedingHelp")
                if not isinstance(child_subjects, list):
                    child_subjects = []
                connection.execute(
                    """
                    INSERT INTO users (id, name, email, password_hash, role, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        child_id,
                        child_name,
                        f"child-{uuid.uuid4()}@demo.local",
                        hash_password("password123"),
                        "student",
                        created_at,
                    ),
                )
                connection.execute(
                    """
                    INSERT INTO student_profiles
                    (id, user_id, grade, school_system, primary_subjects, preferred_language, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"profile-{uuid.uuid4()}",
                        child_id,
                        child_grade,
                        "Demo onboarding",
                        json.dumps(child_subjects),
                        DEFAULT_RESPONSE_LANGUAGE,
                        created_at,
                    ),
                )
                connection.execute(
                    """
                    INSERT INTO parent_children (id, parent_user_id, student_user_id, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (f"parent-child-{uuid.uuid4()}", user_id, child_id, created_at),
                )
            connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Email already exists") from exc
    user = {"id": user_id, "name": payload.name, "email": payload.email, "role": payload.role}
    if payload.preferredLanguage:
        user["preferredLanguage"] = payload.preferredLanguage
    response = {"accessToken": create_access_token(user_id), "user": user, "onboardingStatus": "completed"}
    if payload.role == "student":
        response["parentLinked"] = True
    if payload.role == "tutor":
        response["onboardingStatus"] = "pending_review"
        response["verificationStatus"] = "pending_review"
    return response


async def parse_demo_multipart_upload(request: Request) -> tuple[str, str, bytes]:
    content_type_header = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type_header:
        raise HTTPException(status_code=400, detail="Expected multipart form data")
    body = await request.body()
    body_text = body[:4096].decode("latin-1", errors="ignore")
    filename_match = re.search(r'filename="([^"]+)"', body_text)
    content_type_match = re.search(r"Content-Type:\s*([^\r\n]+)", body_text)
    filename = filename_match.group(1) if filename_match else "upload"
    content_type = content_type_match.group(1).strip() if content_type_match else "application/octet-stream"
    return filename, content_type, body


def validate_demo_upload(filename: str, content_type: str, content: bytes) -> None:
    allowed_types = {"application/pdf", "image/png", "image/jpeg"}
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, PNG, and JPEG files are supported")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be 10 MB or smaller")


@app.post("/files/tutor-credentials")
async def upload_tutor_credential(request: Request) -> dict[str, object]:
    filename, content_type, content = await parse_demo_multipart_upload(request)
    validate_demo_upload(filename, content_type, content)
    file_id = f"credential-file-{uuid.uuid4()}"
    created_at = now_iso()
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO uploaded_files
            (id, conversation_id, uploaded_by_user_id, filename, mime_type, size_bytes, storage_path, status, created_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_id,
                "demo-onboarding",
                filename,
                content_type,
                len(content),
                f"local/demo/tutor-credentials/{file_id}",
                "uploaded",
                created_at,
            ),
        )
        connection.commit()
    return {"id": file_id, "filename": filename, "status": "uploaded"}


@app.post("/files")
async def upload_homework_file(
    request: Request,
    user: dict[str, str] = Depends(require_role("student")),
) -> dict[str, object]:
    filename, content_type, content = await parse_demo_multipart_upload(request)
    validate_demo_upload(filename, content_type, content)
    file_id = f"file-{uuid.uuid4()}"
    created_at = now_iso()
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO uploaded_files
            (id, conversation_id, uploaded_by_user_id, filename, mime_type, size_bytes, storage_path, status, created_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_id,
                user["id"],
                filename,
                content_type,
                len(content),
                f"local/demo/homework/{file_id}",
                "uploaded",
                created_at,
            ),
        )
        connection.commit()
    return {
        "id": file_id,
        "filename": filename,
        "mimeType": content_type,
        "sizeBytes": len(content),
        "status": "uploaded",
        "createdAt": created_at,
    }


@app.post("/analytics/events")
def create_analytics_event(
    payload: AnalyticsEventRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    event_name = (payload.name or payload.eventName or "").strip()
    if not event_name:
        raise HTTPException(status_code=400, detail="Event name is required")
    event_id = f"analytics-{uuid.uuid4()}"
    created_at = now_iso()
    user = optional_user_from_authorization(authorization)
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO analytics_events
            (id, user_id, event_name, role, path, session_id, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                user["id"],
                event_name,
                user["role"],
                payload.path,
                payload.sessionId,
                json.dumps(payload.payload or {}),
                created_at,
            ),
        )
        connection.commit()
    return {"id": event_id, "eventName": event_name, "createdAt": created_at}


def optional_user_from_authorization(authorization: str | None) -> dict[str, str | None]:
    if not authorization or not authorization.startswith("Bearer "):
        return {"id": None, "role": None}
    try:
        user_id = decode_access_token(authorization.removeprefix("Bearer ").strip())
    except HTTPException:
        return {"id": None, "role": None}
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        return {"id": None, "role": None}
    user = public_user(row)
    return {"id": user["id"], "role": user["role"]}


@app.post("/feedback")
def submit_feedback(
    payload: FeedbackRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    feedback_type = payload.type.strip()
    message = payload.message.strip()
    page = payload.page.strip() or "/"
    if feedback_type not in {"bug", "confusion", "suggestion", "praise"}:
        raise HTTPException(status_code=400, detail="Invalid feedback type")
    if not message:
        raise HTTPException(status_code=400, detail="Feedback message is required")
    user = optional_user_from_authorization(authorization)
    feedback_id = f"feedback-{uuid.uuid4()}"
    created_at = payload.createdAt or now_iso()
    user_role = user["role"] or payload.userRole
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO feedback (id, user_id, user_role, page, type, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (feedback_id, user["id"], user_role, page, feedback_type, message, created_at),
        )
        connection.commit()
    return {"ok": True, "feedbackId": feedback_id}


@app.get("/auth/me")
def me(user: dict[str, str] = Depends(current_user)) -> dict[str, str]:
    return user


def profile_response(row, name: str) -> dict[str, object]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "name": name,
        "grade": row["grade"] or "",
        "primarySubjects": json.loads(row["primary_subjects"] or "[]"),
        "schoolSystem": row["school_system"] or "",
        "preferredAnswerLanguage": normalize_response_language(row["preferred_language"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@app.get("/students/me/profile")
def get_student_profile(user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM student_profiles WHERE user_id = ?", (user["id"],)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_response(row, user["name"])


@app.patch("/students/me/profile")
def update_student_profile(
    payload: StudentProfileUpdate,
    user: dict[str, str] = Depends(require_role("student")),
) -> dict[str, object]:
    updated_at = now_iso()
    preferred_language = validate_response_language(payload.preferredAnswerLanguage)
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE student_profiles
            SET grade = COALESCE(?, grade),
                school_system = COALESCE(?, school_system),
                primary_subjects = COALESCE(?, primary_subjects),
                preferred_language = COALESCE(?, preferred_language),
                updated_at = ?
            WHERE user_id = ?
            """,
            (
                payload.grade,
                payload.schoolSystem,
                json.dumps(payload.primarySubjects) if payload.primarySubjects is not None else None,
                preferred_language,
                updated_at,
                user["id"],
            ),
        )
        row = connection.execute("SELECT * FROM student_profiles WHERE user_id = ?", (user["id"],)).fetchone()
        connection.commit()
    return profile_response(row, user["name"])


@app.get("/students/me/learning-history")
def student_history(user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    return {"items": learning_history_for_student(user["id"])}


def learning_history_for_student(student_id: str) -> list[dict[str, str]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, subject, title, summary, created_at
            FROM learning_history
            WHERE student_user_id = ?
            ORDER BY created_at DESC
            """,
            (student_id,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "subject": row["subject"] or "",
            "title": row["title"],
            "summary": row["summary"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


@app.get("/conversations")
def conversations(user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT c.*, (
              SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1
            ) AS last_message
            FROM conversations c
            WHERE student_user_id = ?
            ORDER BY updated_at DESC
            """,
            (user["id"],),
        ).fetchall()
    return {
        "items": [
            {
                "id": row["id"],
                "title": row["title"],
                "subject": row["subject"] or "",
                "grade": row["grade"] or "",
                "updatedAt": row["updated_at"],
                "lastMessagePreview": row["last_message"] or "",
            }
            for row in rows
        ]
    }


@app.get("/conversations/{conversation_id}")
def conversation_detail(conversation_id: str, user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    with get_connection() as connection:
        conversation = connection.execute(
            "SELECT * FROM conversations WHERE id = ? AND student_user_id = ?",
            (conversation_id, user["id"]),
        ).fetchone()
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = connection.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,),
        ).fetchall()
    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "subject": conversation["subject"] or "",
        "grade": conversation["grade"] or "",
        "updatedAt": conversation["updated_at"],
        "messages": [message_response(row) for row in messages],
    }


@app.post("/conversations")
def create_conversation(payload: CreateConversationRequest, user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    conversation_id = f"conv-{uuid.uuid4()}"
    created_at = now_iso()
    title = payload.initialMessage[:48] if payload.initialMessage else f"{payload.subject} question"
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO conversations (id, student_user_id, title, subject, grade, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (conversation_id, user["id"], title, payload.subject, payload.grade, created_at, created_at),
        )
        connection.commit()
    return conversation_detail(conversation_id, user)


@app.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: str, payload: SendMessageRequest, user: dict[str, str] = Depends(require_role("student"))) -> dict[str, object]:
    created_at = now_iso()
    student_message_id = f"msg-{uuid.uuid4()}"
    assistant_message_id = f"msg-{uuid.uuid4()}"
    with get_connection() as connection:
        conversation = connection.execute(
            "SELECT * FROM conversations WHERE id = ? AND student_user_id = ?",
            (conversation_id, user["id"]),
        ).fetchone()
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        connection.execute(
            "INSERT INTO messages (id, conversation_id, role, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (student_message_id, conversation_id, "student", payload.content, "completed", created_at),
        )
        for file_id in payload.attachmentIds or []:
            file_row = connection.execute(
                "SELECT * FROM uploaded_files WHERE id = ? AND uploaded_by_user_id = ?",
                (file_id, user["id"]),
            ).fetchone()
            if file_row is not None:
                connection.execute(
                    """
                    INSERT INTO message_attachments (id, message_id, file_id, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (f"attachment-{uuid.uuid4()}", student_message_id, file_id, created_at),
                )
        profile = connection.execute(
            "SELECT * FROM student_profiles WHERE user_id = ?",
            (user["id"],),
        ).fetchone()
        recent_rows = connection.execute(
            """
            SELECT role, content
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at DESC
            LIMIT 6
            """,
            (conversation_id,),
        ).fetchall()
        recent_messages = tuple(
            ConversationTurn(role=row["role"], content=row["content"])
            for row in reversed(recent_rows)
        )
        registered_subjects = tuple(json.loads(profile["primary_subjects"] or "[]")) if profile is not None else ()
        assistant_result = generate_learning_assistant_response(
            LearningAssistantRequest(
                student_id=user["id"],
                conversation_id=conversation_id,
                question=payload.content,
                grade_level=(profile["grade"] if profile is not None else conversation["grade"]) or "",
                registered_subjects=registered_subjects,
                subject=conversation["subject"] or "General",
                language=normalize_response_language(profile["preferred_language"] if profile is not None else None),
                recent_messages=recent_messages,
                school_system=(profile["school_system"] if profile is not None else None),
            )
        )
        connection.execute(
            "INSERT INTO messages (id, conversation_id, role, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                assistant_message_id,
                conversation_id,
                "assistant",
                assistant_result.text,
                "completed",
                created_at,
            ),
        )
        connection.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (created_at, conversation_id),
        )
        connection.commit()
    return {
        "studentMessage": message_response_by_id(student_message_id),
        "assistantMessage": message_response_by_id(assistant_message_id),
    }


@app.post("/conversations/{conversation_id}/messages/stream")
def stream_message(conversation_id: str, payload: SendMessageRequest, user: dict[str, str] = Depends(require_role("student"))):
    result = send_message(conversation_id, payload, user)
    assistant = result["assistantMessage"]

    def events():
        yield f"event: message_start\ndata: {json.dumps({'messageId': assistant['id'], 'role': 'assistant', 'createdAt': assistant['createdAt']})}\n\n"
        yield f"event: message_delta\ndata: {json.dumps({'messageId': assistant['id'], 'delta': assistant['content']})}\n\n"
        yield f"event: message_done\ndata: {json.dumps({'messageId': assistant['id'], 'status': 'completed'})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


def message_response_by_id(message_id: str) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM messages WHERE id = ?", (message_id,)).fetchone()
    return message_response(row)


def message_response(row) -> dict[str, object]:
    with get_connection() as connection:
        attachments = connection.execute(
            """
            SELECT uf.id, uf.filename, uf.mime_type, uf.size_bytes, uf.status, uf.created_at
            FROM message_attachments ma
            JOIN uploaded_files uf ON uf.id = ma.file_id
            WHERE ma.message_id = ?
            ORDER BY ma.created_at ASC
            """,
            (row["id"],),
        ).fetchall()
    return {
        "id": row["id"],
        "conversationId": row["conversation_id"],
        "role": row["role"],
        "content": row["content"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "attachments": [
            {
                "id": attachment["id"],
                "filename": attachment["filename"],
                "mimeType": attachment["mime_type"],
                "sizeBytes": attachment["size_bytes"],
                "status": attachment["status"],
                "createdAt": attachment["created_at"],
            }
            for attachment in attachments
        ],
    }


def teacher_help_response(row, teacher_name: str | None = None) -> dict[str, object]:
    response = {
        "requestId": row["id"],
        "conversationId": row["conversation_id"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
    if teacher_name:
        response["teacherName"] = teacher_name
    return response


@app.post("/teacher-help/request")
def create_teacher_help_request(
    payload: TeacherHelpCreateRequest,
    user: dict[str, str] = Depends(require_role("student")),
) -> dict[str, object]:
    created_at = now_iso()
    request_id = f"teacher-request-{uuid.uuid4()}"
    with get_connection() as connection:
        conversation = connection.execute(
            "SELECT * FROM conversations WHERE id = ? AND student_user_id = ?",
            (payload.conversationId, user["id"]),
        ).fetchone()
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        connection.execute(
            """
            INSERT INTO teacher_help_requests
              (id, conversation_id, student_user_id, assigned_tutor_user_id, status, request_message, created_at, updated_at)
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
            """,
            (
                request_id,
                payload.conversationId,
                user["id"],
                "pending",
                payload.message or "Student requested help from a teacher.",
                created_at,
                created_at,
            ),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM teacher_help_requests WHERE id = ?", (request_id,)).fetchone()
    return teacher_help_response(row)


@app.get("/teacher-help/request/{request_id}")
def get_teacher_help_request(
    request_id: str,
    user: dict[str, str] = Depends(require_role("student")),
) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT thr.*, u.name AS teacher_name
            FROM teacher_help_requests thr
            LEFT JOIN users u ON u.id = thr.assigned_tutor_user_id
            WHERE thr.id = ? AND thr.student_user_id = ?
            """,
            (request_id, user["id"]),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Teacher help request not found")
    return teacher_help_response(row, row["teacher_name"])


@app.get("/parents/me/children")
def parent_children(user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT u.id, u.name, u.email, sp.grade, sp.primary_subjects
            FROM parent_children pc
            JOIN users u ON u.id = pc.student_user_id
            LEFT JOIN student_profiles sp ON sp.user_id = u.id
            WHERE pc.parent_user_id = ?
            """,
            (user["id"],),
        ).fetchall()
    return {
        "items": [
            {
                "id": row["id"],
                "userId": row["id"],
                "name": row["name"],
                "email": row["email"],
                "grade": row["grade"],
                "subjects": json.loads(row["primary_subjects"] or "[]"),
                "relationship": "child",
            }
            for row in rows
        ]
    }


def ensure_parent_child(parent_id: str, child_id: str) -> None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT 1 FROM parent_children WHERE parent_user_id = ? AND student_user_id = ?",
            (parent_id, child_id),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=403, detail="Forbidden")


@app.get("/parents/me/children/{child_id}/summary")
def child_summary(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    ensure_parent_child(user["id"], child_id)
    with get_connection() as connection:
        student = connection.execute(
            """
            SELECT u.id, u.name, sp.grade
            FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.id = ?
            """,
            (child_id,),
        ).fetchone()
        question_count = connection.execute(
            "SELECT COUNT(*) AS count FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.student_user_id = ? AND m.role = 'student'",
            (child_id,),
        ).fetchone()["count"]
        ai_resolved_count = connection.execute(
            "SELECT COUNT(*) AS count FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.student_user_id = ? AND m.role = 'assistant'",
            (child_id,),
        ).fetchone()["count"]
        help_rows = connection.execute(
            """
            SELECT thr.id, c.subject, thr.status, thr.created_at
            FROM teacher_help_requests thr JOIN conversations c ON c.id = thr.conversation_id
            WHERE thr.student_user_id = ?
            ORDER BY thr.created_at DESC
            """,
            (child_id,),
        ).fetchall()
        recent_rows = connection.execute(
            "SELECT id, subject, title, created_at FROM conversations WHERE student_user_id = ? ORDER BY updated_at DESC LIMIT 5",
            (child_id,),
        ).fetchall()
    return {
        "student": {"id": student["id"], "name": student["name"], "grade": student["grade"]},
        "questionsAskedThisWeek": question_count,
        "aiResolvedThisWeek": ai_resolved_count,
        "teacherHelpRequestsThisWeek": len(help_rows),
        "practiceLessonsCompletedThisWeek": len(recent_rows),
        "weakTopics": ["Quadratic equations"] if question_count else [],
        "recentActivity": [
            {
                "id": row["id"],
                "type": "conversation",
                "title": row["title"],
                "summary": f"Recent {row['subject'] or 'learning'} conversation.",
                "subject": row["subject"] or "",
                "createdAt": row["created_at"],
            }
            for row in recent_rows
        ] + [
            {
                "id": row["id"],
                "type": "teacher_help",
                "title": "Teacher help requested",
                "summary": f"Status: {row['status']}",
                "subject": row["subject"] or "",
                "createdAt": row["created_at"],
            }
            for row in help_rows[:3]
        ][:5],
    }


@app.get("/parents/me/children/{child_id}/history")
def child_history(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    ensure_parent_child(user["id"], child_id)
    return {
        "items": [
            {
                "id": item["id"],
                "type": "practice",
                "title": item["title"],
                "summary": item["summary"],
                "subject": item["subject"],
                "createdAt": item["createdAt"],
            }
            for item in learning_history_for_student(child_id)
        ]
    }


def parent_weekly_report_detail(child_id: str) -> dict[str, object] | None:
    with get_connection() as connection:
        student = connection.execute(
            """
            SELECT u.id, u.name, sp.grade
            FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.id = ?
            """,
            (child_id,),
        ).fetchone()
        report = connection.execute(
            """
            SELECT *
            FROM parent_reports
            WHERE student_user_id = ?
            ORDER BY period_end DESC, created_at DESC
            LIMIT 1
            """,
            (child_id,),
        ).fetchone()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    if report is None:
        return None
    return {
        "id": report["id"],
        "student": {"id": student["id"], "name": student["name"], "grade": student["grade"] or ""},
        "period": {"label": "This week", "startDate": report["period_start"], "endDate": report["period_end"]},
        "summary": report["summary"],
        "stats": json.loads(report["stats_json"]),
        "topSubjects": json.loads(report["top_subjects_json"]),
        "weakTopics": json.loads(report["weak_topics_json"]),
        "recommendations": json.loads(report["recommendations_json"]),
        "generatedAt": report["updated_at"] or report["created_at"],
    }


@app.get("/parents/me/children/{child_id}/report")
def child_report(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    ensure_parent_child(user["id"], child_id)
    report = parent_weekly_report_detail(child_id)
    if report is None:
        return {
            "status": "missing",
            "report": None,
            "message": "No weekly report is available yet.",
        }
    stats = report["stats"] if isinstance(report["stats"], list) else []
    weak_topics = report["weakTopics"] if isinstance(report["weakTopics"], list) else []
    recommendations = report["recommendations"] if isinstance(report["recommendations"], list) else []
    usage_match = (
        re.search(r"\\d+", str(stats[0].get("value", "0"))) if stats and isinstance(stats[0], dict) else None
    )
    return {
        "status": "available",
        "report": {
            "reportId": report["id"],
            "parentId": user["id"],
            "studentId": child_id,
            "weekStart": report["period"]["startDate"],
            "usageCount": int(usage_match.group(0)) if usage_match else 0,
            "aiResolved": 0,
            "teacherResolved": 0,
            "weakKnowledgePoints": [topic["topic"] for topic in weak_topics],
            "recommendations": " ".join(item["description"] for item in recommendations),
        },
        "message": None,
    }


@app.get("/parents/me/children/{child_id}/monthly-report")
def child_monthly_report(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    ensure_parent_child(user["id"], child_id)
    weekly = parent_weekly_report_detail(child_id)
    if weekly is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        **weekly,
        "id": "parent-monthly-report-anna-demo",
        "period": {
            "label": "This month",
            "startDate": "2026-05-01",
            "endDate": "2026-05-31",
        },
        "summary": (
            "Anna is building stronger habits across math, physics, and writing. "
            "A fuller monthly trend can be prepared once more learning activity is available."
        ),
        "isPlaceholder": True,
    }


@app.get("/tutors/me/help-requests")
def tutor_requests(user: dict[str, str] = Depends(require_role("tutor"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT thr.id, thr.conversation_id, thr.status, thr.request_message, thr.created_at, u.name, c.subject, c.grade
            FROM teacher_help_requests thr
            JOIN users u ON u.id = thr.student_user_id
            JOIN conversations c ON c.id = thr.conversation_id
            WHERE thr.assigned_tutor_user_id IS NULL OR thr.assigned_tutor_user_id = ?
            ORDER BY thr.created_at DESC
            """,
            (user["id"],),
        ).fetchall()
    return {
        "items": [
            {
                "requestId": row["id"],
                "conversationId": row["conversation_id"],
                "studentName": row["name"],
                "subject": row["subject"] or "",
                "grade": row["grade"] or "",
                "status": row["status"],
                "requestMessage": row["request_message"] or "",
                "priority": "high" if row["status"] == "pending" else "medium",
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
    }


@app.get("/tutors/me/help-requests/{request_id}")
def tutor_request_detail(request_id: str, user: dict[str, str] = Depends(require_role("tutor"))) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT thr.*, u.name, sp.grade, c.subject
            FROM teacher_help_requests thr
            JOIN users u ON u.id = thr.student_user_id
            LEFT JOIN student_profiles sp ON sp.user_id = u.id
            JOIN conversations c ON c.id = thr.conversation_id
            WHERE thr.id = ? AND (thr.assigned_tutor_user_id IS NULL OR thr.assigned_tutor_user_id = ?)
            """,
            (request_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Request not found")
        messages = connection.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (row["conversation_id"],),
        ).fetchall()
        notes = connection.execute(
            """
            SELECT tn.id, tn.note, tn.created_at, u.id AS tutor_id, u.name AS tutor_name
            FROM teacher_notes tn
            JOIN users u ON u.id = tn.tutor_user_id
            WHERE tn.help_request_id = ?
            ORDER BY tn.created_at ASC
            """,
            (request_id,),
        ).fetchall()
    return {
        "requestId": row["id"],
        "conversationId": row["conversation_id"],
        "student": {"id": row["student_user_id"], "name": row["name"], "grade": row["grade"] or ""},
        "subject": row["subject"] or "",
        "status": row["status"],
        "requestMessage": row["request_message"] or "",
        "messages": [message_response(message) for message in messages],
        "notes": [teacher_note_response(note) for note in notes],
    }


def teacher_note_response(row) -> dict[str, object]:
    return {
        "id": row["id"],
        "note": row["note"],
        "createdAt": row["created_at"],
        "tutor": {"id": row["tutor_id"], "name": row["tutor_name"]},
    }


@app.patch("/tutors/me/help-requests/{request_id}")
def update_tutor_request(
    request_id: str,
    payload: HelpStatusUpdate,
    user: dict[str, str] = Depends(require_role("tutor")),
) -> dict[str, object]:
    if payload.status not in {"pending", "assigned", "in_progress", "resolved", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    updated_at = now_iso()
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM teacher_help_requests WHERE id = ? AND (assigned_tutor_user_id IS NULL OR assigned_tutor_user_id = ?)",
            (request_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Request not found")
        assigned_tutor = row["assigned_tutor_user_id"] or user["id"]
        connection.execute(
            """
            UPDATE teacher_help_requests
            SET status = ?, assigned_tutor_user_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (payload.status, assigned_tutor, updated_at, request_id),
        )
        updated = connection.execute("SELECT * FROM teacher_help_requests WHERE id = ?", (request_id,)).fetchone()
        connection.commit()
    return {
        "requestId": updated["id"],
        "conversationId": updated["conversation_id"],
        "studentName": "",
        "subject": "",
        "grade": "",
        "status": updated["status"],
        "createdAt": updated["created_at"],
    }


@app.post("/tutors/me/help-requests/{request_id}/notes")
def add_tutor_request_note(
    request_id: str,
    payload: TeacherNoteRequest,
    user: dict[str, str] = Depends(require_role("tutor")),
) -> dict[str, object]:
    note = (payload.content or payload.note or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Note is required")
    note_id = f"teacher-note-{uuid.uuid4()}"
    created_at = now_iso()
    with get_connection() as connection:
        request = connection.execute(
            "SELECT * FROM teacher_help_requests WHERE id = ? AND (assigned_tutor_user_id IS NULL OR assigned_tutor_user_id = ?)",
            (request_id, user["id"]),
        ).fetchone()
        if request is None:
            raise HTTPException(status_code=404, detail="Request not found")
        assigned_tutor = request["assigned_tutor_user_id"] or user["id"]
        connection.execute(
            """
            UPDATE teacher_help_requests
            SET assigned_tutor_user_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (assigned_tutor, created_at, request_id),
        )
        connection.execute(
            """
            INSERT INTO teacher_notes (id, help_request_id, tutor_user_id, note, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (note_id, request_id, user["id"], note, created_at),
        )
        connection.commit()
        inserted = connection.execute(
            """
            SELECT tn.id, tn.note, tn.created_at, u.id AS tutor_id, u.name AS tutor_name
            FROM teacher_notes tn
            JOIN users u ON u.id = tn.tutor_user_id
            WHERE tn.id = ?
            """,
            (note_id,),
        ).fetchone()
    return teacher_note_response(inserted)


DEMO_BILLING_PLANS = [
    {
        "id": "free_trial",
        "name": "Free Trial",
        "priceMonthly": 0,
        "currency": "CHF",
        "audience": "Families validating fit before committing.",
        "cta": "Start free trial",
        "features": ["Limited Learning Assistant questions", "Limited file uploads", "Basic learning history"],
    },
    {
        "id": "student",
        "name": "Student Plan",
        "priceMonthly": 29,
        "currency": "CHF",
        "audience": "A student who needs consistent homework help.",
        "cta": "Select student",
        "features": ["Learning Assistant chat", "Homework upload", "Learning history"],
    },
    {
        "id": "family",
        "name": "Family Plan",
        "priceMonthly": 49,
        "currency": "CHF",
        "recommended": True,
        "audience": "Parents who want learning visibility and weekly reporting.",
        "cta": "Select family",
        "features": ["Everything in Student", "Parent dashboard", "Weekly reports"],
    },
    {
        "id": "tutor_supported",
        "name": "Tutor-supported Plan",
        "priceMonthly": 89,
        "currency": "CHF",
        "audience": "Families who want teacher support when guided learning is not enough.",
        "cta": "Select tutor support",
        "features": ["Everything in Family", "Human teacher help quota", "Priority support"],
    },
]


@app.get("/billing/plans")
def billing_plans() -> dict[str, object]:
    return {"items": DEMO_BILLING_PLANS}


@app.get("/billing/subscription")
def billing_subscription(user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    return {"status": "trial", "plan": "free_trial", "currentPeriodEnd": "2026-06-30T00:00:00Z"}


@app.get("/billing/usage")
def billing_usage(user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    return {
        "periodStart": "2026-06-01T00:00:00Z",
        "periodEnd": "2026-06-30T00:00:00Z",
        "aiMessagesUsed": 82,
        "aiMessagesLimit": 500,
        "fileUploadsUsed": 12,
        "fileUploadsLimit": 100,
        "teacherHelpUsed": 4,
        "teacherHelpLimit": 4,
    }


@app.get("/billing/feature-access")
def billing_feature_access(user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    return {
        "canUseChat": True,
        "canUploadFiles": False,
        "canRequestTeacherHelp": True,
        "canViewParentReports": True,
        "reason": {"fileUploads": "File upload quota reached in demo data"},
    }


@app.post("/billing/checkout-session")
def billing_checkout_session(
    payload: CheckoutSessionRequest,
    user: dict[str, str] = Depends(current_user),
) -> dict[str, str]:
    plan_ids = {plan["id"] for plan in DEMO_BILLING_PLANS}
    if payload.plan not in plan_ids:
        raise HTTPException(status_code=400, detail="Invalid billing plan")
    created_at = now_iso()
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO billing_interest (id, user_id, email, plan, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                f"billing-interest-{uuid.uuid4()}",
                user["id"],
                user["email"],
                payload.plan,
                "mock_checkout",
                created_at,
            ),
        )
        connection.commit()
    return {"checkoutUrl": f"/billing/success?plan={payload.plan}"}


@app.get("/referrals/me")
def my_referral(user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    return {
        "code": "KELLER2026",
        "inviteUrl": "http://localhost:5173/register?ref=KELLER2026",
        "successfulInvites": 2,
    }


def support_ticket_response(row) -> dict[str, object]:
    return {
        "id": row["id"],
        "subject": row["subject"],
        "message": row["message"],
        "status": row["status"],
        "priority": row["priority"],
        "category": row["category"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "requesterEmail": row["requester_email"],
    }


@app.post("/support/tickets")
def create_support_ticket(
    payload: SupportTicketCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    subject = payload.subject.strip()
    message = payload.message.strip()
    if not subject or not message:
        raise HTTPException(status_code=400, detail="Support ticket subject and message are required")
    if payload.priority not in {"low", "normal", "high", "urgent"}:
        raise HTTPException(status_code=400, detail="Invalid support ticket priority")
    user = optional_user_from_authorization(authorization)
    created_at = payload.createdAt or now_iso()
    ticket_id = f"ticket-{uuid.uuid4()}"
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO support_tickets
            (id, requester_user_id, requester_email, subject, message, status, priority, category, page, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ticket_id,
                user["id"],
                payload.contactEmail or "",
                subject,
                message,
                "open",
                payload.priority,
                payload.category,
                payload.page,
                created_at,
                created_at,
            ),
        )
        row = connection.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        connection.commit()
    return support_ticket_response(row)


@app.post("/support/requests")
def create_support_request(
    payload: SupportTicketCreateRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    ticket = create_support_ticket(payload, authorization)
    return {"ok": True, "requestId": ticket["id"]}


@app.post("/contact/requests")
def create_contact_request(payload: ContactRequest) -> dict[str, object]:
    name = payload.name.strip()
    email = payload.email.strip()
    message = payload.message.strip()
    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email, and message are required")
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if payload.role not in {"parent", "student", "teacher", "school", "other"}:
        raise HTTPException(status_code=400, detail="Invalid contact role")
    if payload.topic not in {
        "learning_platform",
        "teacher_support",
        "parent_reports",
        "pricing",
        "tutor_application",
        "school_partnership",
        "technical_support",
        "other",
    }:
        raise HTTPException(status_code=400, detail="Invalid contact topic")

    request_id = f"contact-request-{uuid.uuid4()}"
    try:
        email_delivery = deliver_contact_emails(payload, request_id)
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=502, detail=f"Contact email delivery failed: {exc}") from exc

    return {"ok": True, "requestId": request_id, "emailDelivery": email_delivery}


@app.get("/support/tickets")
def support_tickets(user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM support_tickets
            WHERE requester_user_id = ? OR requester_email = ?
            ORDER BY created_at DESC
            """,
            (user["id"], user["email"]),
        ).fetchall()
    return {"items": [support_ticket_response(row) for row in rows]}


@app.get("/support/tickets/{ticket_id}")
def support_ticket_detail(ticket_id: str, user: dict[str, str] = Depends(current_user)) -> dict[str, object]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT * FROM support_tickets
            WHERE id = ? AND (requester_user_id = ? OR requester_email = ?)
            """,
            (ticket_id, user["id"], user["email"]),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Support ticket not found")
    return support_ticket_response(row)


@app.get("/admin/analytics/overview")
def admin_analytics_overview(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        active_users = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        messages_sent = connection.execute("SELECT COUNT(*) AS count FROM messages").fetchone()["count"]
        files_uploaded = connection.execute("SELECT COUNT(*) AS count FROM uploaded_files").fetchone()["count"]
        help_requests = connection.execute("SELECT COUNT(*) AS count FROM teacher_help_requests").fetchone()["count"]
        checkout_completed = connection.execute("SELECT COUNT(*) AS count FROM billing_interest").fetchone()["count"]
    return {
        "activeUsers": active_users,
        "weeklyActiveStudents": 1,
        "newRegistrations": 1,
        "messagesSent": messages_sent,
        "filesUploaded": files_uploaded,
        "teacherHelpRequests": help_requests,
        "parentReportViews": 1,
        "checkoutStarted": checkout_completed,
        "checkoutCompleted": checkout_completed,
        "cancelledSubscriptions": 0,
    }


@app.get("/admin/usage-summary")
def admin_usage_summary(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        users = connection.execute("SELECT role, COUNT(*) AS count FROM users GROUP BY role").fetchall()
        messages = connection.execute("SELECT COUNT(*) AS count FROM messages").fetchone()["count"]
        help_requests = connection.execute("SELECT COUNT(*) AS count FROM teacher_help_requests").fetchone()["count"]
        uploads = connection.execute("SELECT COUNT(*) AS count FROM uploaded_files").fetchone()["count"]
        feedback = connection.execute("SELECT COUNT(*) AS count FROM feedback").fetchone()["count"]
        billing_interest = connection.execute("SELECT COUNT(*) AS count FROM billing_interest").fetchone()["count"]
    role_counts = {"student": 0, "parent": 0, "tutor": 0, "admin": 0}
    role_counts.update({row["role"]: row["count"] for row in users})
    return {
        "activeUsers": sum(role_counts.values()),
        "roleCounts": role_counts,
        "messages": messages,
        "helpRequests": help_requests,
        "uploads": uploads,
        "feedback": feedback,
        "billingInterestItems": billing_interest,
        "generatedAt": now_iso(),
    }


@app.get("/admin/support/tickets")
def admin_support_tickets(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM support_tickets ORDER BY created_at DESC").fetchall()
    return {"items": [support_ticket_response(row) for row in rows]}


@app.patch("/admin/support/tickets/{ticket_id}")
def admin_update_support_ticket(
    ticket_id: str,
    payload: SupportTicketStatusUpdate,
    user: dict[str, str] = Depends(require_role("admin")),
) -> dict[str, object]:
    if payload.status not in {"open", "waiting_on_user", "in_review", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid support ticket status")
    updated_at = now_iso()
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Support ticket not found")
        connection.execute(
            "UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?",
            (payload.status, updated_at, ticket_id),
        )
        updated = connection.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        connection.commit()
    return support_ticket_response(updated)


@app.get("/admin/help-requests")
def admin_help_requests(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT thr.id, thr.status, thr.created_at, u.name AS student_name, c.subject
            FROM teacher_help_requests thr
            JOIN users u ON u.id = thr.student_user_id
            JOIN conversations c ON c.id = thr.conversation_id
            ORDER BY thr.created_at DESC
            """
        ).fetchall()
    return {
        "items": [
            {
                "requestId": row["id"],
                "studentName": row["student_name"],
                "subject": row["subject"] or "",
                "status": row["status"],
                "priority": "high" if row["status"] == "pending" else "medium",
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
    }


@app.get("/admin/feedback")
def admin_feedback(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT f.*, u.email
            FROM feedback f
            LEFT JOIN users u ON u.id = f.user_id
            ORDER BY f.created_at DESC
            """
        ).fetchall()
    return {
        "items": [
            {
                "id": row["id"],
                "type": row["type"],
                "message": row["message"],
                "page": row["page"],
                "userRole": row["user_role"],
                "userEmail": row["email"],
                "status": "new",
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
    }


@app.get("/admin/users")
def admin_users(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute("SELECT id, name, email, role FROM users ORDER BY role, name").fetchall()
    return {
        "items": [
            {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"], "status": "active"}
            for row in rows
        ]
    }


@app.get("/admin/support-requests")
def admin_support_requests(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, subject, status, created_at FROM support_tickets ORDER BY created_at DESC"
        ).fetchall()
    return {
        "items": [
            {"id": row["id"], "subject": row["subject"], "status": row["status"], "createdAt": row["created_at"]}
            for row in rows
        ]
    }


@app.get("/admin/billing-interest")
def admin_billing_interest(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM billing_interest ORDER BY created_at DESC").fetchall()
    return {
        "items": [
            {
                "id": row["id"],
                "email": row["email"],
                "plan": row["plan"],
                "source": row["source"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
    }


@app.get("/admin/system-status")
def admin_system_status(user: dict[str, str] = Depends(require_role("admin"))) -> dict[str, object]:
    return {
        "api": "demo-ok",
        "analytics": "demo-ok",
        "monitoring": "review-ready",
        "generatedAt": now_iso(),
    }
