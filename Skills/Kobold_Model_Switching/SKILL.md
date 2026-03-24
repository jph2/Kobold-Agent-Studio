---
name: Switch Kobold Models (Context Routing)
description: Instructions for AI Agents on how to independently restart the local KoboldCPP backend with specialized models (Long Context, Coding, Reasoning, Speed).
---

# 🤖 Skill: Kobold Model Switching

As an autonomous agent (Antigravity, Cursor, or OpenClaw), you may find that the currently loaded local AI model on the RTX 3090 does not fit your immediate task. For example, you may need a 128k context window to ingest an entire codebase, but the currently loaded 30B model can only handle 24k tokens.

This skill allows you to dynamically kill the running Kobold engine and hot-swap to a specialized model via Windows PowerShell `run_command`.

## Available Models & Capabilities

All launchers are located in `E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers`.

1. **Qwen-2.5-Coder-7B** (`START_Coder_Qwen-7B.bat`)
   - **Best for:** Complex coding tasks, massive codebase analysis.
   - **Context Limit:** 128,000 Tokens

2. **Llama-3.1-8B** (`START_LongContext_Llama-8B.bat`)
   - **Best for:** General extensive reasoning, massive document ingestion.
   - **Context Limit:** 128,000 Tokens

3. **Nemotron-30B** (`START_Heavy_Nemotron-30B.bat`)
   - **Best for:** Complex problem solving, high-quality nuanced text generation.
   - **Context Limit:** 24,576 Tokens

4. **Nemotron-Mini-4B** (`START_Speed_Nemo-Mini-4B.bat`)
   - **Best for:** Millisecond-speed RAG (Retrieval-Augmented Generation), simple queries.
   - **Context Limit:** 4,096 Tokens

## Execution Instructions (For AI Agents)

To execute a model swap on behalf of the user, run the following PowerShell commands.

### 1. Stop the current model
```powershell
Stop-Process -Name "koboldcpp" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
```

### 2. Start the requested model (Example: Coder)
```powershell
# We use Start-Process so it spawns in the background unattached to our current shell
Start-Process "E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\START_Coder_Qwen-7B.bat"
Start-Sleep -Seconds 15
```

### 3. Verification
Verify the model is running and fully loaded into VRAM by querying the Kobold API.
```powershell
curl.exe -s http://localhost:5001/api/v1/model
```
If the output contains the newly requested model's name (e.g. `Qwen2.5-Coder-7B`), the hot-swap was successful! You may now proceed with your massive context extraction or generation task using the `mcp_query_local_model` tools.
