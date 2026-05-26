from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import ResponseCheckInput, check_relevance, evaluate_response


class RelevanceTests(unittest.TestCase):
    def test_linear_equation_answer_uses_question_specific_steps(self) -> None:
        result = evaluate_response(
            ResponseCheckInput(
                text=(
                    "Let's solve the equation step by step. First subtract 5 from both sides. "
                    "Next divide both sides by 3 and check the value in the original equation."
                ),
                question="How do I solve 3x + 5 = 20?",
                grade_level="Grade 8",
                subject="Mathematics",
                registered_subjects=("Mathematics",),
            )
        )

        self.assertTrue(result.ok)

    def test_generic_answer_is_flagged_for_specific_question(self) -> None:
        reasons = check_relevance(
            "Let's work through this step by step. First, identify what the question is asking. "
            "Next, list the information you have and choose a method that fits your current level.",
            "How do I solve 3x + 5 = 20?",
            "Mathematics",
        )

        self.assertIn("irrelevant_answer", reasons)


if __name__ == "__main__":
    unittest.main()

