from __future__ import annotations

import json
import os
import sys
import unittest
from types import SimpleNamespace
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import ResponseCheckInput, evaluate_response
from harness.providers.base import ProviderRequest
from harness.providers.codex_provider import CodexProvider
from harness.providers.router import ProviderRouter
from harness.run_learning_assistant import LearningAssistantRequest, generate_learning_assistant_response


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "demo_question_regression.json"


class CodexProviderBehaviorTests(unittest.TestCase):
    def test_template_provider_returns_guided_answer_without_internal_terms(self) -> None:
        request = LearningAssistantRequest(
            student_id="student-1",
            conversation_id="conv-1",
            question="How do I solve 3x + 5 = 20?",
            grade_level="Grade 8",
            registered_subjects=("Mathematics",),
            subject="Mathematics",
        )

        response = generate_learning_assistant_response(request, ProviderRouter(provider_name="template"))

        self.assertTrue(response.check.ok)
        self.assertTrue(response.fallback_used)
        self.assertIn("step", response.text.lower())
        self.assertNotIn("Codex", response.text)
        self.assertNotIn("AI", response.text)

    def test_codex_unavailable_falls_back_to_template(self) -> None:
        request = LearningAssistantRequest(
            student_id="student-1",
            conversation_id="conv-1",
            question="How do I calculate speed?",
            grade_level="Grade 8",
            registered_subjects=("Physics",),
            subject="Physics",
        )

        with patch("harness.providers.codex_provider.CodexProvider.is_available", return_value=False):
            response = generate_learning_assistant_response(request, ProviderRouter(provider_name="codex"))

        self.assertEqual(response.provider_name, "template")
        self.assertTrue(response.fallback_used)
        self.assertTrue(response.check.ok)

    def test_invalid_provider_configuration_uses_template_fallback(self) -> None:
        request = LearningAssistantRequest(
            student_id="student-1",
            conversation_id="conv-1",
            question="How do I solve 3x + 5 = 20?",
            grade_level="Grade 8",
            registered_subjects=("Mathematics",),
            subject="Mathematics",
        )

        response = generate_learning_assistant_response(request, ProviderRouter(provider_name="invalid"))

        self.assertEqual(response.provider_name, "template")
        self.assertTrue(response.fallback_used)
        self.assertTrue(response.check.ok)

    def test_provider_health_distinguishes_installed_from_callable(self) -> None:
        health = ProviderRouter(provider_name="codex").health()

        self.assertIn("providerInstalled", health)
        self.assertIn("providerCallable", health)

    def test_default_provider_prefers_codex_with_template_fallback(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            router = ProviderRouter()

        self.assertEqual(router.provider_name, "codex")
        self.assertEqual(router.fallback_name, "template")

    def test_codex_provider_allows_ephemeral_temp_directory(self) -> None:
        captured_command: list[str] = []

        def fake_run(command, **kwargs):
            captured_command.extend(command)
            return SimpleNamespace(returncode=0, stdout="Short guided answer.", stderr="")

        request = ProviderRequest(
            prompt="Reply shortly.",
            language="en",
            student_id="student-1",
            conversation_id="conv-1",
            question="Hi",
            subject="General",
            grade_level="Grade 8",
            registered_subjects=("Mathematics",),
        )

        with patch("harness.providers.codex_provider.CodexProvider.is_available", return_value=True):
            with patch("harness.providers.codex_provider.subprocess.run", side_effect=fake_run):
                CodexProvider().generate(request)

        self.assertIn("--skip-git-repo-check", captured_command)

    def test_response_check_rejects_forbidden_terms(self) -> None:
        result = evaluate_response(
            ResponseCheckInput(
                text="This demo AI model prompt comes from the backend.",
                question="How do I solve this?",
                grade_level="Grade 8",
                subject="Mathematics",
                registered_subjects=("Mathematics",),
            )
        )

        self.assertFalse(result.ok)
        self.assertTrue(any(reason.startswith("forbidden_terms") for reason in result.failure_reasons))

    def test_response_check_rejects_direct_answer_first(self) -> None:
        result = evaluate_response(
            ResponseCheckInput(
                text="The answer is x = 5. First subtract 5 from both sides.",
                question="How do I solve x + 5 = 10?",
                grade_level="Grade 8",
                subject="Mathematics",
                registered_subjects=("Mathematics",),
            )
        )

        self.assertFalse(result.ok)
        self.assertIn("direct_answer_first", result.failure_reasons)

    def test_regression_cases_have_required_shape(self) -> None:
        cases = json.loads(DATA_PATH.read_text(encoding="utf-8"))
        expected_ids = {
            "lower_secondary_math_equation",
            "lower_secondary_quadratic_basic",
            "lower_secondary_physics_speed",
            "upper_secondary_function_graph",
            "out_of_grade_calculus",
            "out_of_subject_history",
            "confused_student_followup",
            "teacher_escalation_needed",
        }

        self.assertEqual({case["id"] for case in cases}, expected_ids)
        for case in cases:
            self.assertIn("studentProfile", case)
            self.assertIn("question", case)
            self.assertIn("mustInclude", case)
            self.assertIn("mustNotInclude", case)

    def test_out_of_subject_template_handles_scope_gently(self) -> None:
        request = LearningAssistantRequest(
            student_id="student-1",
            conversation_id="conv-1",
            question="Why did the Roman Empire fall?",
            grade_level="Grade 8",
            registered_subjects=("Mathematics",),
            subject="History",
        )

        response = generate_learning_assistant_response(request, ProviderRouter(provider_name="template"))

        self.assertTrue(response.check.ok)
        self.assertIn("outside", response.text.lower())
        self.assertIn("teacher support", response.text.lower())

    def test_general_subject_template_does_not_force_scope_redirect(self) -> None:
        request = LearningAssistantRequest(
            student_id="student-1",
            conversation_id="conv-1",
            question="Hi",
            grade_level="Grade 8",
            registered_subjects=("Mathematics", "Physics"),
            subject="General",
        )

        response = generate_learning_assistant_response(request, ProviderRouter(provider_name="template"))

        self.assertTrue(response.check.ok)
        self.assertNotIn("outside the subjects", response.text.lower())
        self.assertNotIn("learning profile", response.text.lower())


if __name__ == "__main__":
    unittest.main()
