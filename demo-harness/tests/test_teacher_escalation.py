from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from harness.evaluate_response import check_teacher_escalation_needed


class TeacherEscalationTests(unittest.TestCase):
    def test_repeated_confusion_requires_teacher_support_path(self) -> None:
        reasons = check_teacher_escalation_needed(
            "Let's try the same explanation again with a smaller example.",
            "This is confusing.",
            ("I still don't understand.", "Can you explain again?"),
        )

        self.assertIn("teacher_escalation_missing", reasons)

    def test_repeated_confusion_passes_with_professional_teacher_support(self) -> None:
        reasons = check_teacher_escalation_needed(
            "Let's simplify the first step, and if it still feels unclear, ask for professional teacher support.",
            "This is confusing.",
            ("I still don't understand.", "Can you explain again?"),
        )

        self.assertEqual((), reasons)


if __name__ == "__main__":
    unittest.main()

