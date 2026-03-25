---
name: agent-setup
description: Set up, validate, or repair a Kobold Agent Studio installation on Windows. Use when an agent needs to bootstrap the repo after clone, verify the runtime is wired correctly, reconcile repo paths with the external runtime folder at C:\Kobold-Agent-Studio_LOCAL, start the orchestrator or MCP bridge, confirm model switching, or troubleshoot why the local UI / MCP bridge / Kobold backend is not working.
---

# Agent Setup Skill

Treat this as a strict environment contract, not a loose suggestion.

## Ground truth

There are **two different locations** in this setup:

1. **The repo**
   - Contains source files such as:
     - `orchestrator.py`
     - `router.py`
     - `frontend/`
     - `Launchers/`
     - `Skills/`

2. **The external runtime folder**
   - Expected path:
     - `C:\Kobold-Agent-Studio_LOCAL`
   - This is **not optional**.
   - This folder holds the actual local runtime payload such as:
     - `koboldcpp.exe`
     - the `.gguf` model files
     - `Chat-History/`
     - other runtime-side assets/configs outside the repo

Do **not** assume the repo contains the model files.
Do **not** assume the repo should absorb the runtime folder.
Do **not** refactor hardcoded Windows paths unless the user explicitly asks for that migration.

## Hardcoded path rule

Some paths are intentionally hardcoded for this installation.

Examples:
- launcher `.bat` files call `C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe`
- orchestrator history path points to `C:\Kobold-Agent-Studio_LOCAL\Chat-History`

Do not "clean this up" into relative paths during setup.
First make the existing setup work.
Only after successful validation may you propose a configurability refactor.

## Required files

Before declaring the setup valid, confirm these classes of files exist.

### In the repo
- `orchestrator.py`
- `router.py`
- `frontend/index.html`
- `frontend/script.js`
- `Launchers/START_Coder_Qwen-7B.bat`
- `Launchers/START_LongContext_Llama-8B.bat`
- `Launchers/START_Heavy_Nemotron-30B.bat`
- `Launchers/START_Speed_Nemo-Mini-4B.bat`

### In `C:\Kobold-Agent-Studio_LOCAL`
- `koboldcpp.exe`
- `Qwen2.5-Coder-7B-Instruct-Q8.gguf`
- `Llama-3.1-8B-Instruct-Q8.gguf`
- `Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf`
- `Nemotron-Mini-4B-Instruct-Q8.gguf`

If any of these are missing, stop and report the exact missing file.

## Default model catalog for validation

Use these names as the current intended set:
- Qwen2.5 Coder 7B → `Qwen2.5-Coder-7B-Instruct-Q8.gguf`
- Llama-3.1 8B → `Llama-3.1-8B-Instruct-Q8.gguf`
- Nemotron-Cascade 30B → `Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf`
- Nemotron-Mini 4B → `Nemotron-Mini-4B-Instruct-Q8.gguf`

## Bootstrap order

Perform setup in this order.

1. **Verify Python runtime**
   - Confirm Python is callable.
   - If a project venv is expected, confirm it exists and can run Python.

2. **Verify repo files**
   - Confirm `orchestrator.py`, `router.py`, `frontend/`, and `Launchers/` exist.

3. **Verify external runtime folder**
   - Confirm `C:\Kobold-Agent-Studio_LOCAL` exists.
   - Confirm `koboldcpp.exe` exists.
   - Confirm required `.gguf` files exist.
   - Confirm `Chat-History/` exists or can be created.

4. **Verify launcher integrity**
   - Open each `.bat` file.
   - Confirm it points to `C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe`.
   - Confirm the referenced config path name is plausible.
   - Confirm the launcher filename matches the orchestrator model registry.

5. **Start the orchestrator**
   - Run `python orchestrator.py` from the repo.
   - Confirm the startup banner prints the actual repo path.
   - Confirm the server binds on the expected host/port.

6. **Verify orchestrator API**
   - Confirm:
     - `/api/ping`
     - `/api/models`
   - If these fail, do not continue pretending the UI is healthy.

7. **Start and verify Kobold backend**
   - Start one model manually if necessary via its launcher.
   - Confirm Kobold responds on its local endpoint.
   - Verify the active model can be detected.

8. **Start MCP bridge**
   - Run `python router.py`.
   - Ensure the MCP process starts cleanly.

9. **Verify MCP bridge behavior**
   - Validate at minimum:
     - `healthcheck`
     - `config_info`
   - If available, also verify one prompt roundtrip with a query tool.

10. **Verify model switching**
   - Trigger at least one orchestrator model switch.
   - Confirm the requested launcher file exists.
   - Confirm the backend actually changes model instead of only returning HTTP 200.

## Definition of done

Do **not** say setup is complete until all of the following are true:

- orchestrator starts without syntax/runtime failure
- browser UI can load
- `/api/ping` returns OK
- `/api/models` returns model registry JSON
- Kobold backend is reachable
- current model can be detected
- `router.py` starts as MCP bridge
- MCP `healthcheck` succeeds
- at least one model switch succeeds

## Common failure modes

### 1. Wrong repo copy is being launched
Symptoms:
- startup banner text does not match expected version
- code edits seem to do nothing

Action:
- print and verify the exact running path
- stop stale copies
- restart from the intended repo

### 2. Missing runtime payload in `C:\Kobold-Agent-Studio_LOCAL`
Symptoms:
- launcher starts but nothing useful happens
- `koboldcpp.exe` missing
- model files missing

Action:
- verify exact filenames
- report missing payload explicitly

### 3. Broken launcher mapping
Symptoms:
- switch endpoint returns success but model never starts
- orchestrator points to a nonexistent `.bat`

Action:
- compare orchestrator model registry against actual filenames in `Launchers/`

### 4. Agent "helpfully" rewrote paths
Symptoms:
- `.bat` files now point to relative paths
- runtime no longer finds `koboldcpp.exe`

Action:
- restore the hardcoded working paths first
- do not keep refactoring during incident response

### 5. MCP bridge starts but local model is unreachable
Symptoms:
- `router.py` runs
- `healthcheck` fails

Action:
- verify `KOBOLD_URL`
- verify Kobold backend is actually running
- verify endpoint path shape matches OpenAI-compatible chat endpoint

## Reporting format

When done, report in this format:

- **Repo path:** ...
- **Runtime path:** ...
- **Orchestrator:** working / failed
- **Kobold backend:** working / failed
- **MCP bridge:** working / failed
- **Model switching:** working / failed
- **Missing files:** ...
- **Unsafe assumptions found:** ...
- **Next required human action:** ...

Keep the report concrete.
Do not say "looks good" without explicit evidence.
