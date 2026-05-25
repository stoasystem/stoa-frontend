from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "local.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS student_profiles (
              id TEXT PRIMARY KEY,
              user_id TEXT UNIQUE NOT NULL,
              grade TEXT,
              school_system TEXT,
              primary_subjects TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS parent_children (
              id TEXT PRIMARY KEY,
              parent_user_id TEXT NOT NULL,
              student_user_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              UNIQUE(parent_user_id, student_user_id)
            );

            CREATE TABLE IF NOT EXISTS conversations (
              id TEXT PRIMARY KEY,
              student_user_id TEXT NOT NULL,
              title TEXT NOT NULL,
              subject TEXT,
              grade TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS messages (
              id TEXT PRIMARY KEY,
              conversation_id TEXT NOT NULL,
              role TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS uploaded_files (
              id TEXT PRIMARY KEY,
              conversation_id TEXT,
              uploaded_by_user_id TEXT NOT NULL,
              filename TEXT NOT NULL,
              mime_type TEXT NOT NULL,
              size_bytes INTEGER NOT NULL,
              storage_path TEXT,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS message_attachments (
              id TEXT PRIMARY KEY,
              message_id TEXT NOT NULL,
              file_id TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS teacher_help_requests (
              id TEXT PRIMARY KEY,
              conversation_id TEXT NOT NULL,
              student_user_id TEXT NOT NULL,
              assigned_tutor_user_id TEXT,
              status TEXT NOT NULL,
              request_message TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS learning_history (
              id TEXT PRIMARY KEY,
              student_user_id TEXT NOT NULL,
              conversation_id TEXT,
              subject TEXT,
              title TEXT NOT NULL,
              summary TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS analytics_events (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              event_name TEXT NOT NULL,
              role TEXT,
              path TEXT,
              session_id TEXT,
              payload_json TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS parent_reports (
              id TEXT PRIMARY KEY,
              student_user_id TEXT NOT NULL,
              period_start TEXT NOT NULL,
              period_end TEXT NOT NULL,
              summary TEXT NOT NULL,
              stats_json TEXT NOT NULL,
              top_subjects_json TEXT NOT NULL,
              weak_topics_json TEXT NOT NULL,
              recommendations_json TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS teacher_notes (
              id TEXT PRIMARY KEY,
              help_request_id TEXT NOT NULL,
              tutor_user_id TEXT NOT NULL,
              note TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS feedback (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              user_role TEXT,
              page TEXT NOT NULL,
              type TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS support_tickets (
              id TEXT PRIMARY KEY,
              requester_user_id TEXT,
              requester_email TEXT,
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              status TEXT NOT NULL,
              priority TEXT NOT NULL,
              category TEXT NOT NULL,
              page TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS billing_interest (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              email TEXT NOT NULL,
              plan TEXT NOT NULL,
              source TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
