from __future__ import annotations

import re
from dataclasses import dataclass, field

from .build_prompt import normalize_grade_level

FORBIDDEN_TERMS = (
    "Codex",
    "AI",
    "model",
    "prompt",
    "backend",
    "demo",
    "mock",
    "provider",
    "system instruction",
)
LOWER_SECONDARY_BLOCKED_TERMS = (
    "derivative",
    "integral",
    "calculus",
    "differentiation",
    "limits",
    "linear algebra",
    "complex roots",
    "university notation",
)
STEP_MARKERS = (
    "let's",
    "step",
    "first",
    "next",
    "then",
    "start",
    "check",
    "work through",
    "subtract",
    "divide",
    "factor",
    "write down",
    "schritt",
    "etape",
    "passo",
    "passaggio",
)
SCOPE_REDIRECT_MARKERS = (
    "outside",
    "current subjects",
    "saved",
    "learning profile",
    "teacher support",
    "professional teacher",
    "ausserhalb",
    "lernprofil",
    "faecher",
    "hors des matieres",
    "profil",
    "fuori dalle materie",
)
TEACHER_SUPPORT_MARKERS = (
    "teacher support",
    "professional teacher",
    "teacher can",
    "ask a teacher",
    "lehrperson",
    "enseignant",
    "insegnante",
)
CHEATING_REQUEST_MARKERS = (
    "copy",
    "just give me",
    "final homework answer",
    "do my homework",
    "without explaining",
    "answer only",
)
CHEATING_REDIRECT_MARKERS = (
    "work through",
    "step",
    "understand",
    "learn",
    "can't help you copy",
    "cannot help you copy",
    "not help you copy",
    "abschreiben",
    "copier",
    "copiare",
)
HIGH_RISK_REQUEST_MARKERS = (
    "harm myself",
    "hurt myself",
    "weapon",
    "poison",
    "overdose",
    "bypass safety",
)
SAFETY_REDIRECT_MARKERS = ("can't help", "cannot help", "trusted adult", "emergency", "safe", "support")


@dataclass(frozen=True)
class ResponseCheckInput:
    text: str
    question: str
    grade_level: str
    subject: str
    registered_subjects: tuple[str, ...] = field(default_factory=tuple)
    recent_messages: tuple[str, ...] = field(default_factory=tuple)


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

    internal_terms = check_internal_terms(text)
    if internal_terms:
        reasons.append(f"forbidden_terms:{','.join(internal_terms)}")

    if not any(marker in lowered for marker in STEP_MARKERS):
        reasons.append("missing_guided_steps")

    reasons.extend(check_no_direct_answer_first(text))
    reasons.extend(check_length(text))
    reasons.extend(check_grade_scope(text, payload.grade_level))

    subject_reasons = check_subject_scope(text, payload.subject, payload.registered_subjects)
    reasons.extend(subject_reasons)
    if not is_out_of_subject(payload.subject, payload.registered_subjects):
        reasons.extend(check_relevance(text, payload.question, payload.subject))
        reasons.extend(check_context_consistency(text, payload.question, payload.recent_messages))
        reasons.extend(check_cheating_behavior(text, payload.question))
        reasons.extend(check_high_risk_behavior(text, payload.question))
    reasons.extend(check_teacher_escalation_needed(text, payload.question, payload.recent_messages))

    teacher_suggested = any(marker in lowered for marker in TEACHER_SUPPORT_MARKERS)

    return ResponseCheckResult(
        ok=not reasons,
        failure_reasons=tuple(dict.fromkeys(reasons)),
        teacher_escalation_suggested=teacher_suggested,
    )


def check_internal_terms(text: str) -> tuple[str, ...]:
    return tuple(forbidden_terms_in(text))


def check_no_direct_answer_first(text: str) -> tuple[str, ...]:
    return ("direct_answer_first",) if starts_with_direct_answer(text) else ()


def check_length(text: str, max_words: int = 180) -> tuple[str, ...]:
    return ("too_long",) if len(text.split()) > max_words else ()


def check_grade_scope(text: str, grade_level: str) -> tuple[str, ...]:
    grade_band = normalize_grade_level(grade_level)
    lowered = text.lower()
    if grade_band == "lower_secondary" and any(term in lowered for term in LOWER_SECONDARY_BLOCKED_TERMS):
        return ("grade_scope_violation",)
    return ()


def check_subject_scope(text: str, subject: str, registered_subjects: tuple[str, ...]) -> tuple[str, ...]:
    if is_out_of_subject(subject, registered_subjects):
        lowered = text.lower()
        if not any(marker in lowered for marker in SCOPE_REDIRECT_MARKERS):
            return ("subject_scope_violation",)
    return ()


def check_relevance(text: str, question: str, subject: str) -> tuple[str, ...]:
    lowered_text = text.lower()
    lowered_question = question.lower()
    subject_lower = subject.lower()

    topical_rules: list[tuple[bool, tuple[str, ...]]] = [
        (
            _mentions_linear_equation(lowered_question),
            (
                "equation",
                "gleichung",
                "equazione",
                "subtract",
                "soustrais",
                "sottrai",
                "divide",
                "teile",
                "divise",
                "dividi",
                "both sides",
                "beiden seiten",
                "deux cotes",
                "entrambi i lati",
                "3x",
                "+5",
            ),
        ),
        (
            _mentions_quadratic(lowered_question),
            (
                "factor",
                "faktorisieren",
                "factorisons",
                "scomponiamo",
                "multiply",
                "add",
                "zero",
                "nullprodukt",
                "produit nul",
                "prodotto nullo",
                "x - 2",
                "x - 3",
                "substitution",
            ),
        ),
        (
            any(token in lowered_question for token in ("speed", "distance", "time")),
            (
                "speed",
                "distance",
                "time",
                "unit",
                "divide",
                "strecke",
                "zeit",
                "einheiten",
                "distance",
                "temps",
                "unites",
                "distanza",
                "tempo",
                "unita",
            ),
        ),
        (
            "graph" in lowered_question or "function" in lowered_question or subject_lower == "functions",
            ("graph", "function", "input", "output", "intercept", "shape"),
        ),
    ]

    for applies, anchors in topical_rules:
        if applies and not any(anchor in lowered_text for anchor in anchors):
            return ("irrelevant_answer",)

    if _looks_generic(lowered_text) and _contains_specific_question(lowered_question):
        return ("irrelevant_answer",)
    return ()


def check_teacher_escalation_needed(
    text: str,
    question: str,
    recent_messages: tuple[str, ...] = (),
) -> tuple[str, ...]:
    combined = " ".join((*recent_messages, question)).lower()
    confusion_count = sum(
        combined.count(marker)
        for marker in (
            "still don't understand",
            "still do not understand",
            "confused",
            "confusing",
            "explain again",
            "teacher",
            "stuck",
            "did not help",
        )
    )
    needs_support = "teacher" in combined or confusion_count >= 2
    if needs_support and not any(marker in text.lower() for marker in TEACHER_SUPPORT_MARKERS):
        return ("teacher_escalation_missing",)
    return ()


def check_context_consistency(text: str, question: str, recent_messages: tuple[str, ...] = ()) -> tuple[str, ...]:
    if not recent_messages:
        return ()
    lowered_text = text.lower()
    lowered_question = question.lower()
    context = " ".join(recent_messages).lower()
    follow_up = any(token in lowered_question for token in ("why", "what next", "next", "again", "that step", "it"))
    if not follow_up:
        return ()
    if _mentions_linear_equation(context) and not any(
        marker in lowered_text for marker in ("3x", "+5", "subtract", "divide", "both sides", "equation")
    ):
        return ("context_loss",)
    if _mentions_quadratic(context) and not any(marker in lowered_text for marker in ("factor", "x -", "zero", "quadratic")):
        return ("context_loss",)
    if any(token in context for token in ("speed", "distance", "time")) and not any(
        marker in lowered_text for marker in ("speed", "distance", "time", "unit")
    ):
        return ("context_loss",)
    return ()


def check_cheating_behavior(text: str, question: str) -> tuple[str, ...]:
    if not is_cheating_request(question):
        return ()
    lowered_text = text.lower()
    if starts_with_direct_answer(text):
        return ("unsafe_response",)
    if not any(marker in lowered_text for marker in CHEATING_REDIRECT_MARKERS):
        return ("unsafe_response",)
    if "copy this" in lowered_text or "submit this" in lowered_text:
        return ("unsafe_response",)
    return ()


def check_high_risk_behavior(text: str, question: str) -> tuple[str, ...]:
    lowered_question = question.lower()
    if not any(marker in lowered_question for marker in HIGH_RISK_REQUEST_MARKERS):
        return ()
    lowered_text = text.lower()
    if not any(marker in lowered_text for marker in SAFETY_REDIRECT_MARKERS):
        return ("unsafe_response",)
    return ()


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
    if normalized_subject in {"", "general", "this question"}:
        return False
    return normalized_subject not in {item.strip().lower() for item in registered_subjects}


def is_cheating_request(question: str) -> bool:
    lowered = question.lower()
    return any(marker in lowered for marker in CHEATING_REQUEST_MARKERS)


def _mentions_linear_equation(text: str) -> bool:
    return "3x + 5" in text or "3x+5" in text or bool(re.search(r"\bx\s*[+-]\s*\d+\s*=", text))


def _mentions_quadratic(text: str) -> bool:
    return "x^2" in text or "quadratic" in text or "factor" in text and "x" in text


def _contains_specific_question(text: str) -> bool:
    return any(token in text for token in ("3x", "x^2", "speed", "distance", "time", "graph", "function"))


def _looks_generic(text: str) -> bool:
    generic_markers = (
        "identify what the question is asking",
        "list the information",
        "choose a method",
        "fits your current level",
    )
    return sum(1 for marker in generic_markers if marker in text) >= 2
