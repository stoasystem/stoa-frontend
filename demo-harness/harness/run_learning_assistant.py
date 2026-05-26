from __future__ import annotations

from dataclasses import dataclass, field

from .build_prompt import ConversationTurn, PromptInput, StudentProfile, build_learning_prompt, build_repair_prompt
from .evaluate_response import ResponseCheckInput, ResponseCheckResult, evaluate_response
from .providers.base import ProviderRequest, ProviderResponse
from .providers.router import ProviderRouter, configure_provider_logging, LOGGER
from .providers.template_provider import TemplateProvider

SAFE_FALLBACK_TEXT = (
    "Let's pause and work through the question one step at a time. "
    "First, identify what the question is asking and what information you already have. "
    "If that still feels unclear, you can ask for professional teacher support."
)


@dataclass(frozen=True)
class LearningAssistantRequest:
    student_id: str
    conversation_id: str
    question: str
    grade_level: str
    registered_subjects: tuple[str, ...]
    subject: str
    language: str = "en"
    recent_messages: tuple[ConversationTurn, ...] = field(default_factory=tuple)
    school_system: str | None = None


@dataclass(frozen=True)
class LearningAssistantResponse:
    text: str
    provider_name: str
    fallback_used: bool
    check: ResponseCheckResult


def generate_learning_assistant_response(
    request: LearningAssistantRequest,
    router: ProviderRouter | None = None,
) -> LearningAssistantResponse:
    configure_provider_logging()
    router = router or ProviderRouter()
    prompt_input = PromptInput(
        student_profile=StudentProfile(
            grade_level=request.grade_level,
            subjects_needing_help=request.registered_subjects,
            school_system=request.school_system,
        ),
        question=request.question,
        subject=request.subject,
        language=request.language,
        conversation_id=request.conversation_id,
        student_id=request.student_id,
        recent_messages=request.recent_messages,
    )
    prompt = build_learning_prompt(prompt_input)
    provider_request = ProviderRequest(
        prompt=prompt,
        language=request.language,
        student_id=request.student_id,
        conversation_id=request.conversation_id,
        question=request.question,
        subject=request.subject,
        grade_level=request.grade_level,
        registered_subjects=request.registered_subjects,
    )

    response = router.generate(provider_request)
    check = check_response(response.text, request)
    if check.ok:
        return LearningAssistantResponse(response.text, response.provider_name, response.fallback_used, check)

    LOGGER.warning("response check failed reasons=%s", ",".join(check.failure_reasons))
    if not response.fallback_used:
        repair_prompt = build_repair_prompt(prompt, response.text, list(check.failure_reasons))
        repaired = router.generate(
            ProviderRequest(
                prompt=repair_prompt,
                language=request.language,
                student_id=request.student_id,
                conversation_id=request.conversation_id,
                question=request.question,
                subject=request.subject,
                grade_level=request.grade_level,
                registered_subjects=request.registered_subjects,
            )
        )
        repaired_check = check_response(repaired.text, request)
        if repaired_check.ok:
            return LearningAssistantResponse(repaired.text, repaired.provider_name, repaired.fallback_used, repaired_check)
        LOGGER.warning("response repair failed reasons=%s", ",".join(repaired_check.failure_reasons))

    fallback = TemplateProvider().generate(provider_request)
    fallback_check = check_response(fallback.text, request)
    if not fallback_check.ok:
        LOGGER.error("safe fallback used after fallback check failed reasons=%s", ",".join(fallback_check.failure_reasons))
        safe_check = check_response(SAFE_FALLBACK_TEXT, request)
        return LearningAssistantResponse(SAFE_FALLBACK_TEXT, "template", True, safe_check)
    return LearningAssistantResponse(fallback.text, fallback.provider_name, True, fallback_check)


def check_response(text: str, request: LearningAssistantRequest) -> ResponseCheckResult:
    return evaluate_response(
        ResponseCheckInput(
            text=text,
            question=request.question,
            grade_level=request.grade_level,
            subject=request.subject,
            registered_subjects=request.registered_subjects,
            recent_messages=tuple(message.content for message in request.recent_messages),
        )
    )
