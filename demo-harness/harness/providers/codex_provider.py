from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from .base import ProviderRequest, ProviderResponse


class CodexProvider:
    provider_name = "codex"

    def __init__(self, timeout_seconds: int | None = None) -> None:
        self.timeout_seconds = timeout_seconds or int(os.getenv("STOA_DEMO_PROVIDER_TIMEOUT_SECONDS", "60"))

    def is_available(self) -> bool:
        return shutil.which("codex") is not None

    def sanitized_env(self) -> dict[str, str]:
        allowed_keys = ("PATH", "HOME", "CODEX_HOME", "LANG", "LC_ALL", "TMPDIR")
        return {key: value for key in allowed_keys if (value := os.environ.get(key))}

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        if not self.is_available():
            raise RuntimeError("Codex command is unavailable")

        with tempfile.TemporaryDirectory(prefix="stoa-codex-provider-") as temp_dir:
            output_path = Path(temp_dir) / "codex-output.txt"
            command = [
                "codex",
                "exec",
                "--ephemeral",
                "--ignore-rules",
                "-C",
                temp_dir,
                "--sandbox",
                "read-only",
                "--output-last-message",
                str(output_path),
                "-",
            ]
            try:
                result = subprocess.run(
                    command,
                    input=request.prompt,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_seconds,
                    check=False,
                    cwd=temp_dir,
                    env=self.sanitized_env(),
                )
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError("Codex provider timed out") from exc

            if result.returncode != 0:
                detail = (result.stderr or result.stdout or "Unknown Codex provider error").strip()
                raise RuntimeError(detail)

            text = output_path.read_text(encoding="utf-8").strip() if output_path.exists() else result.stdout.strip()
            if not text:
                raise RuntimeError("Codex provider returned an empty response")

            return ProviderResponse(text=text, provider_name=self.provider_name)
