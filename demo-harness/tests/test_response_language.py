from __future__ import annotations

import unittest

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.providers.router import ProviderRouter
from harness.run_learning_assistant import LearningAssistantRequest, generate_learning_assistant_response


class ResponseLanguageTests(unittest.TestCase):
    def test_template_provider_uses_requested_language(self) -> None:
        cases = (
            ("en", "Let's"),
            ("de", "Schritt"),
            ("fr", "etape"),
            ("it", "passo"),
        )

        for language, expected_marker in cases:
            with self.subTest(language=language):
                request = LearningAssistantRequest(
                    student_id="student-1",
                    conversation_id="conv-1",
                    question="How should I start?",
                    grade_level="Grade 8",
                    registered_subjects=("Mathematics",),
                    subject="Mathematics",
                    language=language,
                )

                response = generate_learning_assistant_response(request, ProviderRouter(provider_name="template"))

                self.assertTrue(response.check.ok, response.check.failure_reasons)
                self.assertIn(expected_marker.lower(), response.text.lower())

    def test_out_of_scope_template_respects_requested_language(self) -> None:
        cases = (
            ("de", "lernprofil"),
            ("fr", "profil"),
            ("it", "profilo"),
        )

        for language, expected_marker in cases:
            with self.subTest(language=language):
                request = LearningAssistantRequest(
                    student_id="student-1",
                    conversation_id="conv-1",
                    question="Why did the Roman Empire fall?",
                    grade_level="Grade 8",
                    registered_subjects=("Mathematics",),
                    subject="History",
                    language=language,
                )

                response = generate_learning_assistant_response(request, ProviderRouter(provider_name="template"))

                self.assertTrue(response.check.ok, response.check.failure_reasons)
                self.assertIn(expected_marker, response.text.lower())


if __name__ == "__main__":
    unittest.main()

