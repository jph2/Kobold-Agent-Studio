import os
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Kobold-Claw-Link-MCP")

DEFAULT_KOBOLD_URL = "http://localhost:5001/v1/chat/completions"
DEFAULT_MODEL = "nemotron-cascade-2"
DEFAULT_TIMEOUT = 180.0
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 4096
FAST_MAX_TOKENS = 1024
DEEP_MAX_TOKENS = 4096
FAST_TEMPERATURE = 0.3
DEEP_TEMPERATURE = 0.7


def _get_env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _get_env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _normalize_kobold_url(raw_url: str) -> str:
    raw_url = (raw_url or DEFAULT_KOBOLD_URL).strip()
    if not raw_url:
        raw_url = DEFAULT_KOBOLD_URL

    parts = urlsplit(raw_url)
    path = parts.path.rstrip("/")
    if not path:
        path = "/v1/chat/completions"
    elif path == "/v1":
        path = "/v1/chat/completions"

    return urlunsplit((parts.scheme or "http", parts.netloc, path, parts.query, parts.fragment))


def _config() -> dict[str, Any]:
    return {
        "kobold_url": _normalize_kobold_url(os.getenv("KOBOLD_URL", DEFAULT_KOBOLD_URL)),
        "kobold_model": os.getenv("KOBOLD_MODEL", DEFAULT_MODEL),
        "kobold_timeout": _get_env_float("KOBOLD_TIMEOUT", DEFAULT_TIMEOUT),
        "default_temperature": _get_env_float("KOBOLD_TEMPERATURE", DEFAULT_TEMPERATURE),
        "default_max_tokens": _get_env_int("KOBOLD_MAX_TOKENS", DEFAULT_MAX_TOKENS),
    }


def _clamp_temperature(value: float) -> float:
    return max(0.0, min(float(value), 2.0))


def _clamp_max_tokens(value: int) -> int:
    return max(1, min(int(value), 8192))


async def _post_chat(messages: list[dict[str, str]], temperature: float, max_tokens: int) -> str:
    cfg = _config()
    payload = {
        "model": cfg["kobold_model"],
        "messages": messages,
        "temperature": _clamp_temperature(temperature),
        "max_tokens": _clamp_max_tokens(max_tokens),
    }

    async with httpx.AsyncClient(timeout=cfg["kobold_timeout"]) as client:
        try:
            response = await client.post(cfg["kobold_url"], json=payload)
            response.raise_for_status()
            result = response.json()

            choices = result.get("choices")
            if not isinstance(choices, list) or not choices:
                return "Error: unexpected response format from local model (missing choices)."

            message = choices[0].get("message") or {}
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content

            if isinstance(content, list):
                text_chunks = []
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text" and isinstance(item.get("text"), str):
                        text_chunks.append(item["text"])
                joined = "\n".join(chunk for chunk in text_chunks if chunk.strip()).strip()
                if joined:
                    return joined

            return "Error: unexpected response format from local model (missing message content)."
        except httpx.HTTPStatusError as e:
            body = e.response.text[:1200] if e.response is not None else ""
            return f"HTTP error from local model ({e.response.status_code}): {body}"
        except httpx.RequestError as e:
            return f"Connection error to local model ({type(e).__name__}): {e}"
        except ValueError as e:
            return f"Invalid JSON from local model ({type(e).__name__}): {e}"
        except Exception as e:
            return f"Unexpected error talking to local model ({type(e).__name__}): {e}"


@mcp.tool()
async def healthcheck() -> str:
    """Check whether the configured Kobold endpoint is reachable."""
    cfg = _config()
    async with httpx.AsyncClient(timeout=min(cfg["kobold_timeout"], 20.0)) as client:
        try:
            response = await client.post(
                cfg["kobold_url"],
                json={
                    "model": cfg["kobold_model"],
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 1,
                    "temperature": 0,
                },
            )
            response.raise_for_status()
            return f"OK: endpoint reachable ({response.status_code}) at {cfg['kobold_url']} using model {cfg['kobold_model']}"
        except httpx.HTTPStatusError as e:
            body = e.response.text[:600] if e.response is not None else ""
            return f"HTTP error at {cfg['kobold_url']} ({e.response.status_code}): {body}"
        except Exception as e:
            return f"ERROR: endpoint unreachable at {cfg['kobold_url']} ({type(e).__name__}: {e})"


@mcp.tool()
def config_info() -> dict[str, Any]:
    """Return the active bridge configuration without exposing secrets."""
    cfg = _config()
    return {
        "name": "Kobold-Claw-Link-MCP",
        "scope": "minimal MCP bridge to a single configured KoboldCpp/OpenAI-compatible chat endpoint",
        "config": cfg,
        "profiles": {
            "fast": {
                "temperature": FAST_TEMPERATURE,
                "max_tokens": FAST_MAX_TOKENS,
            },
            "deep": {
                "temperature": DEEP_TEMPERATURE,
                "max_tokens": DEEP_MAX_TOKENS,
            },
        },
    }


@mcp.tool()
async def query_local_model(
    prompt: str,
    system_prompt: str = "",
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    """Send a prompt to the configured local model endpoint."""
    cfg = _config()
    prompt = (prompt or "").strip()
    if not prompt:
        return "Error: prompt must not be empty."

    messages: list[dict[str, str]] = []
    if system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt.strip()})
    messages.append({"role": "user", "content": prompt})

    return await _post_chat(
        messages=messages,
        temperature=cfg["default_temperature"] if temperature is None else temperature,
        max_tokens=cfg["default_max_tokens"] if max_tokens is None else max_tokens,
    )


@mcp.tool()
async def query_fast(prompt: str, system_prompt: str = "") -> str:
    """Use a lower-cost fast profile for shorter answers or quick checks."""
    prompt = (prompt or "").strip()
    if not prompt:
        return "Error: prompt must not be empty."
    messages: list[dict[str, str]] = []
    if system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt.strip()})
    messages.append({"role": "user", "content": prompt})
    return await _post_chat(messages, temperature=FAST_TEMPERATURE, max_tokens=FAST_MAX_TOKENS)


@mcp.tool()
async def query_deep(prompt: str, system_prompt: str = "") -> str:
    """Use a deeper profile for longer reasoning-style answers."""
    prompt = (prompt or "").strip()
    if not prompt:
        return "Error: prompt must not be empty."
    messages: list[dict[str, str]] = []
    if system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt.strip()})
    messages.append({"role": "user", "content": prompt})
    return await _post_chat(messages, temperature=DEEP_TEMPERATURE, max_tokens=DEEP_MAX_TOKENS)


if __name__ == "__main__":
    mcp.run()
