from __future__ import annotations

from .base import ProviderRequest, ProviderResponse


class TemplateProvider:
    provider_name = "template"

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        subject = request.subject or "this question"
        question = (request.question or "").lower()

        if "teacher" in question or "still" in question or "confused" in question or "do not understand" in question:
            text = (
                "Let's slow down and look at the part that feels unclear. "
                "Point to the first step where you get stuck, then compare it with the rule or example you used before. "
                "If that step still does not make sense, it is a good moment to ask for professional teacher support."
            )
        elif subject.lower() not in {item.lower() for item in request.registered_subjects} and request.registered_subjects:
            text = (
                "This looks outside the subjects saved in your learning profile. "
                "I can help you connect the question to your current subjects, or you can ask for professional teacher support "
                "if you need help beyond that scope."
            )
        elif any(token in question for token in ("3x + 5", "3x+5", "x^2", "quadratic", "solve")):
            text = (
                "Let's work through the structure first. "
                "Start by identifying what operation is being done to the unknown, then undo those operations in reverse order. "
                "Write each change on both sides of the equation and check whether the result makes the original statement true."
            )
        elif "speed" in question or "distance" in question or "time" in question:
            text = (
                "Let's sort the information first. "
                "Write down the distance, the time, and what the question asks for. "
                "Then choose the relationship that connects those three ideas and check that the units match."
            )
        else:
            text = (
                "Let's work through this step by step. "
                "First, identify what the question is asking. "
                "Next, list the information you already have and choose a method that fits your current level. "
                "If one step still feels unclear, you can ask for professional teacher support."
            )

        return ProviderResponse(text=text, provider_name=self.provider_name, fallback_used=True)

