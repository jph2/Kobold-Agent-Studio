# Kobold-Claw-Link-MCP

A small MCP bridge that lets agent frameworks call a local **KoboldCpp** server, including a Windows workhorse over Tailscale.

This repository is now a **minimal usable connector v1**.
It is still **not** a full router.

## Current scope
It currently provides:
- `healthcheck` — confirms the configured endpoint is reachable
- `config_info` — shows the active bridge configuration and query profiles
- `query_local_model` — sends a configurable chat request
- `query_fast` — shorter / cheaper profile
- `query_deep` — longer / heavier profile

## What it is
- a thin MCP bridge to **one configured KoboldCpp/OpenAI-compatible chat endpoint**
- suitable for private local-model calls from agent systems
- a stepping stone toward a later multi-target routing layer

## What it is not yet
- no model autodiscovery
- no multi-model routing
- no scheduling / queueing
- no session persistence or context window management beyond a single request
- no independent auth/security layer beyond your network boundary

## Requirements
- Python 3.10+
- `pip install mcp httpx`
- a running KoboldCpp server exposing a chat-compatible HTTP endpoint

## Configuration
Environment variables:
- `KOBOLD_URL` — full endpoint URL; default: `http://localhost:5001/v1/chat/completions`
- `KOBOLD_MODEL` — model label sent in the payload; default: `nemotron-cascade-2`
- `KOBOLD_TIMEOUT` — request timeout in seconds; default: `180`
- `KOBOLD_TEMPERATURE` — default temperature for `query_local_model`; default: `0.7`
- `KOBOLD_MAX_TOKENS` — default max tokens for `query_local_model`; default: `4096`

If `KOBOLD_URL` is given as just `/v1`, the bridge normalizes it to `/v1/chat/completions`.

### Example local setup
```json
"kobold-nemotron-bridge": {
  "command": "python",
  "args": ["E:/path/to/Kobold-Claw-Link-MCP/router.py"],
  "env": {
    "KOBOLD_URL": "http://localhost:5001/v1/chat/completions",
    "KOBOLD_MODEL": "nemotron-cascade-2",
    "KOBOLD_TIMEOUT": "180",
    "KOBOLD_TEMPERATURE": "0.7",
    "KOBOLD_MAX_TOKENS": "4096"
  }
}
```

### Example Tailscale setup
```json
"kobold-nemotron-bridge": {
  "command": "python",
  "args": ["/path/to/Kobold-Claw-Link-MCP/router.py"],
  "env": {
    "KOBOLD_URL": "http://100.x.y.z:5001/v1/chat/completions",
    "KOBOLD_MODEL": "nemotron-cascade-2"
  }
}
```

## Recommended operating model
Use this bridge when:
- you want private/local inference
- the Windows RTX 3090 host is available
- heavier background or browser-adjacent jobs should prefer the workhorse machine

Do not pretend this bridge solves full routing yet.
It currently just gives a cleaner connector surface.

## Acceptance criteria for this v1
- bridge starts cleanly
- `healthcheck` succeeds against the running KoboldCpp endpoint
- `config_info` exposes the active config clearly
- `query_local_model` works with the configured endpoint
- `query_fast` and `query_deep` provide simple profile separation
- errors are readable instead of opaque crashes

## Next sensible upgrades
- model / server capability inspection
- better response-shape tolerance across backends
- structured diagnostic logging
- optional retries for transient failures
- real routing once multiple local targets or profiles matter
