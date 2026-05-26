from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import check_internal_terms


class InternalTermLeakageTests(unittest.TestCase):
    def test_internal_terms_are_detected(self) -> None:
        matches = check_internal_terms("This demo AI model prompt came from the backend system instruction.")

        self.assertIn("AI", matches)
        self.assertIn("model", matches)
        self.assertIn("prompt", matches)
        self.assertIn("backend", matches)
        self.assertIn("system instruction", matches)

    def test_normal_learning_answer_has_no_internal_terms(self) -> None:
        matches = check_internal_terms("Let's work through the equation step by step.")

        self.assertEqual((), matches)


if __name__ == "__main__":
    unittest.main()

