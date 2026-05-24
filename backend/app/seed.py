from __future__ import annotations

import json
import base64
import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from app.database import get_connection, initialize_database

USERS = [
    ("user-student", "Anna Keller", "student@test.com", "student"),
    ("user-parent", "Martin Keller", "parent@test.com", "parent"),
    ("user-tutor", "Dr. Lena Vogt", "tutor@test.com", "tutor"),
    ("user-admin", "STOA Admin", "admin@test.com", "admin"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${base64.b64encode(digest).decode()}"


def insert_seed_data() -> None:
    initialize_database()
    created_at = now_iso()
    with get_connection() as connection:
        for user_id, name, email, role in USERS:
            connection.execute(
                """
                INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, name, email, hash_password("password123"), role, created_at),
            )

        connection.execute(
            """
            INSERT OR IGNORE INTO student_profiles
            (id, user_id, grade, school_system, primary_subjects, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "student-profile-1",
                "user-student",
                "Grade 8",
                "Swiss Gymnasium",
                json.dumps(["Mathematics", "Physics"]),
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO parent_children (id, parent_user_id, student_user_id, created_at)
            VALUES (?, ?, ?, ?)
            """,
            ("parent-child-1", "user-parent", "user-student", created_at),
        )

        conversations = [
            ("conv-1", "Quadratic equations", "Mathematics"),
            ("conv-2", "Forces and motion", "Physics"),
            ("conv-3", "Essay thesis practice", "English"),
        ]
        for conversation_id, title, subject in conversations:
            connection.execute(
                """
                INSERT OR IGNORE INTO conversations
                (id, student_user_id, title, subject, grade, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (conversation_id, "user-student", title, subject, "Grade 8", created_at, created_at),
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO messages
                (id, conversation_id, role, content, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    f"msg-{conversation_id}-1",
                    conversation_id,
                    "student",
                    f"I need help with {title.lower()}.",
                    "completed",
                    created_at,
                ),
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO messages
                (id, conversation_id, role, content, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    f"msg-{conversation_id}-2",
                    conversation_id,
                    "assistant",
                    "Let's break it into steps and check the core idea first.",
                    "completed",
                    created_at,
                ),
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO learning_history
                (id, student_user_id, conversation_id, subject, title, summary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"history-{conversation_id}",
                    "user-student",
                    conversation_id,
                    subject,
                    title,
                    f"Practiced {title.lower()} with guided AI support.",
                    created_at,
                ),
            )

        connection.execute(
            """
            INSERT OR IGNORE INTO teacher_help_requests
            (id, conversation_id, student_user_id, assigned_tutor_user_id, status, request_message, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "teacher-request-1",
                "conv-1",
                "user-student",
                None,
                "pending",
                "I do not understand this step.",
                created_at,
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO teacher_help_requests
            (id, conversation_id, student_user_id, assigned_tutor_user_id, status, request_message, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "teacher-request-2",
                "conv-2",
                "user-student",
                "user-tutor",
                "assigned",
                "Can a tutor check my force diagram?",
                created_at,
                created_at,
            ),
        )
        connection.commit()


if __name__ == "__main__":
    insert_seed_data()
    print("Seeded local STOA database")
