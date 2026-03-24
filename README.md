# 🤖 Kobold Agent Studio

Welcome to **Kobold Agent Studio** (formerly Kobold-Claw-Link-MCP) – the ultimate local command center for autonomous AI agents and system power-users! 

This project is tailored for high-end local systems (like the NVIDIA RTX 3090 with 24GB VRAM). It transforms a simple `koboldcpp` backend installation into a highly secure, dynamic "Multi-Brain" environment. It serves both as a dedicated routing server for autonomous MCP tasks (e.g., Cursor / OpenClaw) and as a standalone, powerful Chat Dashboard.

---

## 🔥 Core Features

* **🔌 KI Engine Hot-Swapping:** Seamlessly switch between specialized AI architectures with a single click in your browser (e.g., transition from deep *Nemotron-30B Reasoning* to massive *Qwen-7B Coder* repositories). The Python Orchestrator boots and unloads runtimes silently in the background.
* **🧠 Memory Compression Protocol:** When a model's context capacity overflows before a transition, the application can trigger a highly dense LLM interaction to distill your massive chat history into an *"Inherited Memory Briefing"*. The subsequent model reads these compressed architectural specifications to seamlessly maintain context instead of truncating it!
* **🛡️ Security & XSS Armor:** A fully hardened Web UI featuring DOM sanitizers against malicious script exploits from raw AI generations, alongside repaired, isolated `localStorage` caching.
* **🤖 Autonomous Agent Routing (Skills):** External agent frameworks (like Cursor or OpenClaw) can utilize the dedicated `SKILL.md` to instruct the Orchestrator autonomously, booting up the appropriate "brain" for distinct code or analysis steps.
* **💾 Memory State Export:** Backup and import valuable chat histories ("KV-Cache Mimicry") between different development sessions as compact `.json` files.
* **⚡ Native Context Overrides:** Bypasses native 8k training limits to cram massive **128,000 Token Windows** straight into the 24GB VRAM of a 3090 consumer card!

---

## 🛠️ System Requirements

For a stable experience and full utilization of framework swapping, the following setup is required:

* **OS:** Windows 10/11
* **Runtime:** Python 3.10+
* **Hardware (GPU):** An enthusiast-grade NVIDIA GPU (e.g., **RTX 3090 / 4090** with 24 GB VRAM) is highly recommended for maximizing pure reasoning across vast context boundaries.
* **Backend Binaries:** The `koboldcpp.exe` executable. *Crucial: To ensure the launchers function properly, this file must be situated in the physical root directory `C:\Kobold-Agent-Studio_LOCAL\`.*

---

## 🚀 The "Fantastic Four" Models

Your command center comes out of the box tuned to orchestrate 4 specialized models. (These models must be identically named as `.gguf` files inside `C:\Kobold-Agent-Studio_LOCAL\`).

1. **Qwen2.5 Coder 7B** `(Qwen2.5-Coder-7B-Instruct-Q8.gguf)`
   - **128,000** Token Context | Brutally efficient for massive codebases and repositories.
2. **Llama-3.1 8B** `(Llama-3.1-8B-Instruct-Q8.gguf)`
   - **128,000** Token Context | The perfect generalist for deep document research.
3. **Nemotron-Cascade 30B** `(Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf)`
   - **24,576** Token Context | The dense "Reasoning" brain for complex logic tasks without hallucinations.
4. **Nemotron-Mini 4B** `(Nemotron-Mini-4B-Instruct-Q8.gguf)`
   - **4,096** Token Context | Lightning fast (Instant Latency) for simple RAG integrations and rudimentary queries.

---

## ⚙️ Start Commands & Usage

The application manages itself once the orchestrator is active:

1. Clone or enter this repository:
   ```bash
   cd Kobold-Agent-Studio
   ```
2. Start the brain and Web UI:
   ```bash
   venv\Scripts\python.exe orchestrator.py
   ```
3. Open `http://localhost:8080/` in your web browser and command your own local AI datacenters!
