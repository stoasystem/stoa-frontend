from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import check_subject_scope


class SubjectScopeTests(unittest.TestCase):
    def test_out_of_subject_direct_answer_is_flagged(self) -> None:
        reasons = check_subject_scope(
            "The French Revolution began in 1789 and changed French politics.",
            "History",
            ("Mathematics", "Physics"),
        )

        self.assertIn("subject_scope_violation", reasons)

    def test_out_of_subject_redirect_passes(self) -> None:
        reasons = check_subject_scope(
            "Let's check your learning profile first. This is outside your current subjects, "
            "so you can ask for professional teacher support if you need help beyond the saved scope.",
            "History",
            ("Mathematics", "Physics"),
        )

        self.assertEqual((), reasons)


if __name__ == "__main__":
    unittest.main()

