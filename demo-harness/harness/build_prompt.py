from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


PROMPT_DIR = Path(__file__).resolve().parents[1] / "prompts"


@dataclass(frozen=True)
class StudentProfile:
    grade_level: str
    subjects_needing_help: tuple[str, ...]
    school_system: str | None = None


@dataclass(frozen=True)
class ConversationTurn:
    role: str
    content: str


@dataclass(frozen=True)
class PromptInput:
    student_profile: StudentProfile
    question: str
    subject: str
    language: str = "en"
    conversation_id: str | None = None
    student_id: str | None = None
    recent_messages: tuple[ConversationTurn, ...] = ()


def load_prompt(name: str) -> str:
    return (PROMPT_DIR / name).read_text(encoding="utf-8").strip()


def normalize_grade_level(grade: str | None) -> str:
    normalized = (grade or "").strip().lower()
    if any(token in normalized for token in ("grade 7", "grade 8", "grade 9", "lower", "secondary")):
        return "lower_secondary"
    if any(token in normalized for token in ("grade 10", "grade 11", "grade 12", "upper", "gymnasium")):
        return "upper_secondary"
    return "unknown"


def build_learning_prompt(prompt_input: PromptInput) -> str:
    profile = prompt_input.student_profile
    grade_band = normalize_grade_level(profile.grade_level)
    subjects = ", ".join(profile.subjects_needing_help) if profile.subjects_needing_help else "not specified"
    recent_context = format_recent_context(prompt_input.recent_messages)

    return "\n\n".join(
        [
            load_prompt("base_learning_assistant.md"),
            load_prompt("grade_rules.md"),
            load_prompt("subject_rules.md"),
            load_prompt("teacher_escalation_rules.md"),
            "Forbidden visible words: Codex, AI, model, prompt, backend, demo, mock, provider.",
            f"Student grade: {profile.grade_level}",
            f"Grade band: {grade_band}",
            f"Registered subjects: {subjects}",
            f"Conversation subject: {prompt_input.subject}",
            f"Response language: {prompt_input.language}",
            f"Recent context:\n{recent_context}",
            f"Student question:\n{prompt_input.question}",
            "Return only the Learning Assistant message that the student should see.",
        ]
    )


def build_repair_prompt(original_prompt: str, failed_text: str, failure_reasons: list[str]) -> str:
    reasons = ", ".join(failure_reasons)
    return "\n\n".join(
        [
            original_prompt,
            "The previous draft failed the response rules.",
            f"Failure reasons: {reasons}",
            "Rewrite it now. Keep it natural, guided, age-appropriate, and free of forbidden visible words.",
            "Previous draft:",
            failed_text,
        ]
    )


def format_recent_context(messages: tuple[ConversationTurn, ...]) -> str:
    if not messages:
        return "No previous messages."
    lines = []
    for message in messages[-6:]:
        content = " ".join(message.content.split())
        if len(content) > 280:
            content = f"{content[:277]}..."
        lines.append(f"- {message.role}: {content}")
    return "\n".join(lines)

