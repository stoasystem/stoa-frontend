from __future__ import annotations

from .base import ProviderRequest, ProviderResponse


class TemplateProvider:
    provider_name = "template"

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        subject = request.subject or "this question"
        question = (request.question or "").lower()
        language = (request.language or "en").lower()
        out_of_scope = subject.lower() not in {item.lower() for item in request.registered_subjects} and bool(
            request.registered_subjects
        )

        if out_of_scope:
            text = (
                "Let's first check the learning scope. "
                "This looks outside the subjects saved in your learning profile. "
                "I can help you connect the question to your current subjects, or you can ask for professional teacher support "
                "if you need help beyond that scope."
            )
        elif language.startswith("de"):
            text = (
                "Lass uns Schritt fuer Schritt arbeiten. "
                "Beginne mit der Frage: Was ist gegeben und was soll gefunden werden? "
                "Wenn dieser Schritt weiter unklar bleibt, ist professionelle Unterstuetzung durch eine Lehrperson sinnvoll."
            )
        elif language.startswith("fr"):
            text = (
                "Avancons etape par etape. "
                "Commence par reperer ce qui est donne et ce que la question demande. "
                "Si une etape reste confuse, tu peux demander l'aide d'un enseignant."
            )
        elif language.startswith("it"):
            text = (
                "Procediamo passo dopo passo. "
                "Prima individua i dati e che cosa chiede la domanda. "
                "Se un passaggio resta poco chiaro, puoi chiedere supporto a un insegnante."
            )
        elif any(token in question for token in ("copy", "just give me", "final homework answer", "do my homework", "answer only")):
            text = (
                "I can't help you copy a final homework answer, but we can work through the first step together. "
                "Start by naming what the problem is asking, then choose the operation or rule that moves you one step closer. "
                "If you share your attempt, I can help you check the reasoning."
            )
        elif "teacher" in question or "still" in question or "confused" in question or "do not understand" in question:
            text = (
                "Let's slow down and look at the part that feels unclear. "
                "Point to the first step where you get stuck, then compare it with the rule or example you used before. "
                "If that step still does not make sense, it is a good moment to ask for professional teacher support."
            )
        elif "3x + 5" in question or "3x+5" in question:
            text = (
                "Let's solve the equation step by step. "
                "First, the +5 is attached to 3x, so subtract 5 from both sides to keep the equation balanced. "
                "Next, divide both sides by 3, then check the result by putting it back into the original equation."
            )
        elif "x^2" in question or "quadratic" in question:
            text = (
                "Let's factor the quadratic step by step. "
                "First, look for two numbers that multiply to 6 and add to 5, because those numbers build the two brackets. "
                "Next, use the zero-product idea and check each value in the original equation."
            )
        elif "solve" in question:
            text = (
                "Let's work through the structure first. "
                "Use one step at a time: start by identifying what operation is being done to the unknown, then undo those operations in reverse order. "
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
