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
        connection.execute(
            """
            INSERT OR IGNORE INTO uploaded_files
            (id, conversation_id, uploaded_by_user_id, filename, mime_type, size_bytes, storage_path, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "file-demo-force-diagram",
                "conv-2",
                "user-student",
                "force-diagram-homework.pdf",
                "application/pdf",
                184_320,
                "local/demo/force-diagram-homework.pdf",
                "parsed",
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO message_attachments (id, message_id, file_id, created_at)
            VALUES (?, ?, ?, ?)
            """,
            ("attachment-demo-force-diagram", "msg-conv-2-1", "file-demo-force-diagram", created_at),
        )
        help_requests = [
            (
                "teacher-request-3",
                "conv-3",
                "user-student",
                None,
                "pending",
                "Can a teacher check whether my essay thesis is specific enough?",
            ),
            (
                "teacher-request-4",
                "conv-1",
                "user-student",
                "user-tutor",
                "resolved",
                "Please confirm my factoring steps.",
            ),
        ]
        for request in help_requests:
            connection.execute(
                """
                INSERT OR IGNORE INTO teacher_help_requests
                (id, conversation_id, student_user_id, assigned_tutor_user_id, status, request_message, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*request, created_at, created_at),
            )
        connection.execute(
            """
            INSERT OR REPLACE INTO parent_reports
            (id, student_user_id, period_start, period_end, summary, stats_json, top_subjects_json, weak_topics_json, recommendations_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "parent-report-anna-week-1",
                "user-student",
                "2026-05-18",
                "2026-05-24",
                "Anna made steady progress this week, especially when she broke math and physics problems into smaller steps before asking for help.",
                json.dumps(
                    [
                        {"label": "Questions asked", "value": "3", "description": "Across 3 subjects"},
                        {"label": "Teacher help sessions", "value": "2", "description": "1 active with tutor"},
                        {"label": "Practice streak", "value": "4 days", "description": "Recent local activity"},
                    ]
                ),
                json.dumps(
                    [
                        {
                            "id": "subject-math",
                            "name": "Mathematics",
                            "questionsAnswered": 1,
                            "teacherHelpCount": 1,
                            "progressLabel": "Improving",
                            "summary": "More confident solving equations after step-by-step practice.",
                        },
                        {
                            "id": "subject-physics",
                            "name": "Physics",
                            "questionsAnswered": 1,
                            "teacherHelpCount": 1,
                            "progressLabel": "Needs review",
                            "summary": "Force diagrams are the main follow-up area for next week.",
                        },
                        {
                            "id": "subject-english",
                            "name": "English",
                            "questionsAnswered": 1,
                            "teacherHelpCount": 0,
                            "progressLabel": "Steady",
                            "summary": "Thesis practice is on track with short guided prompts.",
                        },
                    ]
                ),
                json.dumps(
                    [
                        {
                            "id": "weak-topic-quadratics",
                            "subject": "Mathematics",
                            "topic": "Quadratic equations",
                            "level": "medium",
                            "summary": "Anna should keep writing each transformation before simplifying.",
                        },
                        {
                            "id": "weak-topic-forces",
                            "subject": "Physics",
                            "topic": "Force diagrams",
                            "level": "high",
                            "summary": "Arrow labels and direction checks need focused practice.",
                        },
                    ]
                ),
                json.dumps(
                    [
                        {
                            "id": "recommendation-force-diagram",
                            "title": "Review one force diagram",
                            "description": "Walk through labels, direction, and net force before the next physics assignment.",
                            "priority": "high",
                        },
                        {
                            "id": "recommendation-algebra-steps",
                            "title": "Explain algebra steps aloud",
                            "description": "Ask Anna to state why each transformation is valid before checking the answer.",
                            "priority": "medium",
                        },
                        {
                            "id": "recommendation-essay-prompts",
                            "title": "Keep essay practice focused",
                            "description": "Use short thesis prompts this week so writing practice stays manageable.",
                            "priority": "low",
                        },
                    ]
                ),
                created_at,
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO teacher_notes (id, help_request_id, tutor_user_id, note, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                "teacher-note-1",
                "teacher-request-2",
                "user-tutor",
                "Student understands the concept but needs help labeling force arrows consistently.",
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO analytics_events
            (id, user_id, event_name, role, path, session_id, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "analytics-demo-parent-report",
                "user-parent",
                "parent_report_viewed",
                "parent",
                "/parent/children/user-student/report",
                "demo-session",
                json.dumps({"childId": "user-student", "source": "seed"}),
                created_at,
            ),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO feedback
            (id, user_id, user_role, page, type, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "feedback-demo-1",
                "user-parent",
                "parent",
                "/parent/children/user-student/report",
                "suggestion",
                "The weekly report is useful. I would like a clearer next-step checklist.",
                created_at,
            ),
        )
        support_tickets = [
            (
                "ticket-101",
                "user-parent",
                "parent@test.com",
                "Parent report did not refresh",
                "The weekly report still shows last week for my child.",
                "in_review",
                "normal",
                "parent_report",
                "/parent/children/user-student/report",
            ),
            (
                "ticket-102",
                "user-student",
                "student@test.com",
                "Question upload failed on mobile",
                "The image upload stopped after selecting a homework photo.",
                "open",
                "high",
                "file_upload",
                "/chat",
            ),
        ]
        for ticket in support_tickets:
            connection.execute(
                """
                INSERT OR IGNORE INTO support_tickets
                (id, requester_user_id, requester_email, subject, message, status, priority, category, page, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*ticket, created_at, created_at),
            )
        connection.execute(
            """
            INSERT OR IGNORE INTO billing_interest
            (id, user_id, email, plan, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("billing-interest-demo-1", "user-parent", "parent@test.com", "family", "mock_checkout", created_at),
        )
        connection.commit()


if __name__ == "__main__":
    insert_seed_data()
    print("Seeded local STOA database")
