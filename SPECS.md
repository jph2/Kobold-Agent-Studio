# 📋 Kobold-Claw-Link-MCP: Project Specifications & Requests

This document distills the original user requests, technical requirements, and implemented features achieved during the development of the local AI Agent infrastructure.

## 1. Goal & Vision
To create an "Agent-Ready", highly stable local LLM interface and MCP framework powered by an RTX 3090 (24GB VRAM). The system must support autonomous agent interactions, massive context windows for coding tasks, and provide a state-of-the-art Web UI for human prompt engineering.

## 2. Implemented Requests & Specifications

### 🖥️ Infrastructure & Routing
- [x] **REQ:** A robust MCP Router that does not crash if the local LLM is offline.
  - **Spec:** Implemented comprehensive exception handling (`router.py`) to prevent agent-side disconnects.
- [x] **REQ:** Bypass the clunky built-in KoboldAI Lite UI (`port 5001`).
  - **Spec:** Developed a standalone, lightweight, and modern UI served on `port 8080`.

### 🧠 Performance & Context Maximization (RTX 3090 Focus)
- [x] **REQ:** Bypass hardcoded 8k context limits and fully utilize the 24GB VRAM.
  - **Spec:** Applied `overridenativecontext` to `.kcpps` profiles, allowing 100% VRAM allocation.
  - **Spec:** Benchmarked the "Sweet Spot" for 30B models at exactly `24,576` Tokens.
- [x] **REQ:** Provide models specifically for massive context tasks (Coding) und lightweight RAG.
  - **Spec:** Integrated **Qwen2.5-Coder-7B** & **Llama-3.1-8B** to achieve gigantuan **128,000 Token** context windows on a single 3090 by utilizing smaller parameter sizes.

### 🤖 Autonomous Agent Integration (Skills)
- [x] **REQ:** Agents operating within the system must be able to switch models.
  - **Spec:** Created `Kobold_Model_Switching/SKILL.md`. Agents (Cursor, OpenClaw) can autonomously kill the Kobold process and execute `.bat` launchers to hot-swap to models with higher context dynamically.

### 🎨 Advanced Human-in-the-Loop Web UI
- [x] **REQ:** Persistent chat logs.
  - **Spec:** Implemented `localStorage` state saving. Chat survives browser refreshes.
- [x] **REQ:** Advanced prompt-engineering controls.
  - **Spec:** Added Edit, Delete, and Regenerate (Regen 🎲) buttons to individual messages.
- [x] **REQ:** Live token tracking.
  - **Spec:** Implemented a real-time visual "Context Gauge" to monitor token limits.
  - **Spec:** Live API pinging on `port 5001` to display the absolute current active model file.

### 🔄 Dynamic Hot-Swapping & Orchestration
- [x] **REQ:** "KV-Cache Dumping" equivalent logic to carry context across models.
  - **Spec:** Added **💾 Export** and **📂 Import** Chat State buttons. Users can save the exact chat history, swap the model, load the history back, and seamlessly continue without losing prompt context.
- [x] **REQ:** One-Click UI Model Hot-Swapping with Pros/Cons cards.
  - **Spec:** Built `orchestrator.py` to replace static `http.server`. It acts as a bridge between the browser and OS.
  - **Spec:** Added a top-bar **Model Hub Gallery** displaying 4 tailored models (Pros, Cons, Speed, Context Size).
  - **Spec:** Clicking a model checks token capacity and warns of potential truncation ("Context Overflow Warning") before utilizing Python to kill and reboot the `.bat` launchers in the background.

## 3. Pending / Future Requests
- [ ] Investigate real-time text streaming (SSE/WebSockets) for the frontend to reduce perceived latency on large generation tasks.
- [ ] Connect the UI remotely (e.g., Mobile access) using Sunshine/Moonlight streaming infrastructures or direct tunneling.
