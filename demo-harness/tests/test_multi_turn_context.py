from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import check_context_consistency

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "multi_turn_test_cases.json"


class MultiTurnContextTests(unittest.TestCase):
    def test_multi_turn_data_contains_required_scenarios(self) -> None:
        cases = json.loads(DATA_PATH.read_text(encoding="utf-8"))
        expected_ids = {
            "linear-equation-followup-1",
            "quadratic-factoring-followup-1",
            "physics-speed-formula-followup-1",
            "repeated-confusion-teacher-support-1",
            "unrelated-after-math-1",
            "direct-answer-only-request-1",
            "unclear-upload-simulation-1",
            "above-grade-calculus-1",
        }

        self.assertEqual(expected_ids, {case["id"] for case in cases})

    def test_followup_keeps_linear_equation_context(self) -> None:
        reasons = check_context_consistency(
            "Because +5 is being added to 3x, subtract 5 from both sides to undo that step.",
            "Why do we subtract 5?",
            ("How do I solve 3x + 5 = 20?",),
        )

        self.assertEqual((), reasons)

    def test_followup_context_loss_is_flagged(self) -> None:
        reasons = check_context_consistency(
            "Let's talk about reading strategies and note-taking instead.",
            "Why do we subtract 5?",
            ("How do I solve 3x + 5 = 20?",),
        )

        self.assertIn("context_loss", reasons)


if __name__ == "__main__":
    unittest.main()

