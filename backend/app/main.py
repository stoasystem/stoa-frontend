from __future__ import annotations

import json
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.auth import create_access_token, current_user, decode_access_token, hash_password, now_iso, public_user, require_role, verify_password
from app.database import get_connection, initialize_database

app = FastAPI(title="STOA Local Test Backend")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(LoginRequest):
    name: str
    role: str


class StudentProfileUpdate(BaseModel):
    grade: str | None = None
    primarySubjects: list[str] | None = None
    schoolSystem: str | None = None


class CreateConversationRequest(BaseModel):
    subject: str = "General"
    grade: str = "Grade 8"
    initialMessage: str | None = None


class SendMessageRequest(BaseModel):
    content: str
    attachmentIds: list[str] | None = None


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


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
    if payload.role not in {"student", "parent", "tutor", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    user_id = f"user-{uuid.uuid4()}"
    created_at = now_iso()
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
                connection.execute(
                    """
                    INSERT INTO student_profiles (id, user_id, grade, school_system, primary_subjects, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (f"profile-{uuid.uuid4()}", user_id, "Grade 8", "", json.dumps([]), created_at),
                )
            connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Email already exists") from exc
    user = {"id": user_id, "name": payload.name, "email": payload.email, "role": payload.role}
    return {"accessToken": create_access_token(user_id), "user": user}


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
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE student_profiles
            SET grade = COALESCE(?, grade),
                school_system = COALESCE(?, school_system),
                primary_subjects = COALESCE(?, primary_subjects),
                updated_at = ?
            WHERE user_id = ?
            """,
            (
                payload.grade,
                payload.schoolSystem,
                json.dumps(payload.primarySubjects) if payload.primarySubjects is not None else None,
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
        connection.execute(
            "INSERT INTO messages (id, conversation_id, role, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (assistant_message_id, conversation_id, "assistant", "This local backend saved your question.", "completed", created_at),
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
    return {
        "id": row["id"],
        "conversationId": row["conversation_id"],
        "role": row["role"],
        "content": row["content"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "attachments": [],
    }


@app.get("/parents/me/children")
def parent_children(user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT u.id, u.name, sp.grade, sp.primary_subjects
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
                "name": row["name"],
                "grade": row["grade"] or "",
                "primarySubjects": json.loads(row["primary_subjects"] or "[]"),
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
        "student": {"id": student["id"], "name": student["name"], "grade": student["grade"] or ""},
        "stats": [
            {"label": "Questions Asked", "value": str(question_count), "description": "Saved locally"},
            {"label": "Teacher Help Sessions", "value": str(len(help_rows)), "description": "All time"},
            {"label": "Active Subjects", "value": str(len({row["subject"] for row in recent_rows})), "description": "Recent"},
        ],
        "weakTopics": [
            {"id": "topic-1", "subject": "Mathematics", "topic": "Quadratic equations", "level": "medium"}
        ],
        "recentQuestions": [
            {
                "id": row["id"],
                "subject": row["subject"] or "",
                "title": row["title"],
                "createdAt": row["created_at"],
                "status": "answered_by_ai",
            }
            for row in recent_rows
        ],
        "teacherHelpRecords": [
            {"id": row["id"], "subject": row["subject"] or "", "status": row["status"], "createdAt": row["created_at"]}
            for row in help_rows
        ],
    }


@app.get("/parents/me/children/{child_id}/history")
def child_history(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
    ensure_parent_child(user["id"], child_id)
    return {"items": learning_history_for_student(child_id)}


@app.get("/parents/me/children/{child_id}/report")
def child_report(child_id: str, user: dict[str, str] = Depends(require_role("parent"))) -> dict[str, object]:
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
        raise HTTPException(status_code=404, detail="Report not found")
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
