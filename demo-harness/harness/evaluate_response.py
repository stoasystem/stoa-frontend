from __future__ import annotations

import re
from dataclasses import dataclass, field

from .build_prompt import normalize_grade_level

FORBIDDEN_TERMS = ("Codex", "AI", "model", "prompt", "backend", "demo", "mock", "provider")
LOWER_SECONDARY_BLOCKED_TERMS = ("derivative", "integral", "calculus", "differentiation", "limits")
STEP_MARKERS = ("let's", "step", "first", "next", "then", "start", "check", "work through")


@dataclass(frozen=True)
class ResponseCheckInput:
    text: str
    question: str
    grade_level: str
    subject: str
    registered_subjects: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ResponseCheckResult:
    ok: bool
    failure_reasons: tuple[str, ...] = ()
    teacher_escalation_suggested: bool = False


def evaluate_response(payload: ResponseCheckInput) -> ResponseCheckResult:
    reasons: list[str] = []
    text = payload.text.strip()
    lowered = text.lower()

    if not text:
        reasons.append("empty_response")

    forbidden_matches = forbidden_terms_in(text)
    if forbidden_matches:
        reasons.append(f"forbidden_terms:{','.join(forbidden_matches)}")

    if starts_with_direct_answer(text):
        reasons.append("direct_answer_first")

    if len(text.split()) > 180:
        reasons.append("too_long")

    if not any(marker in lowered for marker in STEP_MARKERS):
        reasons.append("missing_guided_steps")

    grade_band = normalize_grade_level(payload.grade_level)
    if grade_band == "lower_secondary" and any(term in lowered for term in LOWER_SECONDARY_BLOCKED_TERMS):
        reasons.append("grade_scope_violation")

    if is_out_of_subject(payload.subject, payload.registered_subjects):
        if not any(marker in lowered for marker in ("outside", "current subjects", "saved", "teacher support")):
            reasons.append("subject_scope_violation")

    teacher_suggested = "teacher support" in lowered or "professional teacher" in lowered

    return ResponseCheckResult(
        ok=not reasons,
        failure_reasons=tuple(reasons),
        teacher_escalation_suggested=teacher_suggested,
    )


def forbidden_terms_in(text: str) -> list[str]:
    matches: list[str] = []
    for term in FORBIDDEN_TERMS:
        if re.search(rf"\b{re.escape(term)}\b", text, flags=re.IGNORECASE):
            matches.append(term)
    return matches


def starts_with_direct_answer(text: str) -> bool:
    first = text.strip()[:180].lower()
    direct_patterns = (
        r"^x\s*=",
        r"^the answer is\b",
        r"^answer:\b",
        r"^final answer\b",
        r"^it is\s+[-0-9]",
        r"\bthe solution is\b",
    )
    return any(re.search(pattern, first) for pattern in direct_patterns)


def is_out_of_subject(subject: str, registered_subjects: tuple[str, ...]) -> bool:
    if not registered_subjects:
        return False
    normalized_subject = subject.strip().lower()
    return normalized_subject not in {item.strip().lower() for item in registered_subjects}

