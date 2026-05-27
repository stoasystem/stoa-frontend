from __future__ import annotations

import logging
import os
from pathlib import Path

from .base import LearningProvider, ProviderRequest, ProviderResponse
from .codex_provider import CodexProvider
from .template_provider import TemplateProvider

LOGGER = logging.getLogger("stoa.demo_provider")
LOG_PATH = Path(__file__).resolve().parents[2] / "logs" / "provider.log"


def configure_provider_logging() -> None:
    if LOGGER.handlers:
        return
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    LOGGER.addHandler(handler)
    LOGGER.setLevel(logging.INFO)


def provider_from_name(name: str) -> LearningProvider:
    normalized = name.strip().lower()
    if normalized == "codex":
        return CodexProvider()
    if normalized == "template":
        return TemplateProvider()
    raise ValueError(f"Unsupported demo provider: {name}")


class ProviderRouter:
    def __init__(self, provider_name: str | None = None, fallback_name: str | None = None) -> None:
        configure_provider_logging()
        self.provider_name = provider_name or os.getenv("STOA_DEMO_PROVIDER", "codex")
        self.fallback_name = fallback_name or os.getenv("STOA_DEMO_PROVIDER_FALLBACK", "template")

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        LOGGER.info("provider selected provider=%s fallback=%s", self.provider_name, self.fallback_name)

        try:
            provider = provider_from_name(self.provider_name)
            response = provider.generate(request)
            LOGGER.info("provider success provider=%s", response.provider_name)
            return response
        except Exception as exc:
            reason = exc.__class__.__name__
            LOGGER.warning("provider fallback reason=%s provider=%s", reason, self.provider_name)
            try:
                fallback = provider_from_name(self.fallback_name)
            except Exception:
                LOGGER.warning("invalid fallback provider configured fallback=%s", self.fallback_name)
                fallback = TemplateProvider()
            fallback_response = fallback.generate(request)
            return ProviderResponse(
                text=fallback_response.text,
                provider_name=fallback_response.provider_name,
                fallback_used=True,
                failure_reason=reason,
            )

    def health(self) -> dict[str, object]:
        provider_installed = True
        provider_callable: bool | str = "not_checked"
        valid_provider = self.provider_name in {"codex", "template"}
        valid_fallback = self.fallback_name in {"codex", "template"}
        if self.provider_name == "codex":
            provider_installed = CodexProvider(timeout_seconds=int(os.getenv("STOA_DEMO_PROVIDER_HEALTH_TIMEOUT_SECONDS", "5"))).is_available()
        ok = valid_provider and valid_fallback and (provider_installed or self.fallback_name == "template")
        return {
            "ok": ok,
            "provider": self.provider_name,
            "fallback": self.fallback_name,
            "mode": "demo",
            "providerInstalled": provider_installed,
            "providerCallable": provider_callable,
        }
