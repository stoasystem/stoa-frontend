from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ProviderRequest:
    prompt: str
    language: str
    student_id: str | None = None
    conversation_id: str | None = None
    question: str | None = None
    subject: str | None = None
    grade_level: str | None = None
    registered_subjects: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ProviderResponse:
    text: str
    provider_name: str
    raw_debug: str | None = None
    fallback_used: bool = False
    failure_reason: str | None = None


class LearningProvider(Protocol):
    provider_name: str

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        ...

