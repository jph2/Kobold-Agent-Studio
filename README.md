# 🤖 Kobold Agent Studio

Welcome to **Kobold Agent Studio** (formerly Kobold-Claw-Link-MCP) – the ultimate local command center for autonomous AI agents and system power-users! 

This project is tailored for high-end local systems (like the NVIDIA RTX 3090 with 24GB VRAM). It transforms a simple `koboldcpp` backend installation into a highly secure, dynamic "Multi-Brain" environment. It serves both as a dedicated routing server for autonomous MCP tasks (e.g., Cursor / OpenClaw) and as a standalone, powerful Chat Dashboard.

---

## 🔥 Core Features

* **🔌 KI Engine Hot-Swapping:** Seamlessly switch between specialized AI architectures with a single click in your browser (e.g., transition from deep *Nemotron-30B Reasoning* to massive *Qwen-7B Coder* repositories). The Python Orchestrator boots and unloads runtimes silently in the background.
* **🌐 Web Search (RAG):** Built-in DuckDuckGo Lite integration that automatically scrapes HTML, parses URLs, and injects live internet data discretely into the AI's context window.
* **🛡️ Global Kill Switch & Auto-Timeout:** A beautiful, glossy Double-Click safety switch to instantly purge 24GB of VRAM across the network. Includes a 15-minute background auto-shutdown daemon to free the GPU for other family members.
* **📝 Persistent Markdown Memory:** Chat logs are continuously auto-saved to the backend's `Chat-History/` folder as structured `.md` files, perfectly replicating commercial "Memory" mechanics.
* **🌍 Network-Aware Architecture:** The frontend dynamically resolves IPs, allowing you to access and command your local AI datacenter from any PC or smartphone on your home Wi-Fi.
* **🧠 Memory Compression Protocol:** When a model's context capacity overflows before a transition, the application can distill your massive chat history into an *"Inherited Memory Briefing"* for the next model to ingest.
* **🦾 Security & XSS Armor:** A fully hardened Web UI featuring DOM sanitizers against malicious script exploits from raw AI generations.
* **🤖 Autonomous Agent Routing:** External agent frameworks (like Cursor or OpenClaw) can utilize the dedicated `SKILL.md` to instruct the Orchestrator autonomously.
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
