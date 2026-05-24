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
            """
        )
