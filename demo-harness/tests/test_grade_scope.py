from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import check_grade_scope


class GradeScopeTests(unittest.TestCase):
    def test_lower_secondary_rejects_calculus_terms(self) -> None:
        reasons = check_grade_scope("Use a derivative and an integral to solve it.", "Grade 8")

        self.assertIn("grade_scope_violation", reasons)

    def test_lower_secondary_accepts_factoring_language(self) -> None:
        reasons = check_grade_scope("First factor the quadratic, then check each value.", "Grade 8")

        self.assertEqual((), reasons)


if __name__ == "__main__":
    unittest.main()

