from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "demo-harness"))

os.environ["STOA_DEMO_PROVIDER"] = "template"

import app.database as database


class PreferredAnswerLanguageBackendTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        database.DB_PATH = Path(self.temp_dir.name) / "local.db"

        from app.main import app
        from app.seed import insert_seed_data

        database.initialize_database()
        insert_seed_data()
        self.app = app

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_register_profile_update_and_chat_use_answer_language(self) -> None:
        from fastapi.testclient import TestClient

        client = TestClient(self.app)
        register_response = client.post(
            "/auth/register",
            json={
                "name": "Language Student",
                "email": "language-student@test.com",
                "password": "password123",
                "role": "student",
                "preferredLanguage": "en",
                "profile": {
                    "grade": "Grade 8",
                    "schoolSystem": "Swiss lower secondary",
                    "subjectsNeedingHelp": ["Mathematics"],
                    "preferredAnswerLanguage": "de",
                },
            },
        )
        self.assertEqual(register_response.status_code, 200, register_response.text)
        token = register_response.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        profile_response = client.get("/students/me/profile", headers=headers)
        self.assertEqual(profile_response.status_code, 200, profile_response.text)
        self.assertEqual(profile_response.json()["preferredAnswerLanguage"], "de")

        update_response = client.patch(
            "/students/me/profile",
            headers=headers,
            json={"preferredAnswerLanguage": "fr"},
        )
        self.assertEqual(update_response.status_code, 200, update_response.text)
        self.assertEqual(update_response.json()["preferredAnswerLanguage"], "fr")

        conversation_response = client.post(
            "/conversations",
            headers=headers,
            json={"subject": "Mathematics", "grade": "Grade 8"},
        )
        self.assertEqual(conversation_response.status_code, 200, conversation_response.text)
        conversation_id = conversation_response.json()["id"]

        message_response = client.post(
            f"/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": "How do I solve 3x + 5 = 20?"},
        )
        self.assertEqual(message_response.status_code, 200, message_response.text)
        assistant_text = message_response.json()["assistantMessage"]["content"].lower()
        self.assertIn("etape", assistant_text)


if __name__ == "__main__":
    unittest.main()
