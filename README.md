# Kobold-Claw-Link-MCP 🔗

A high-performance **MCP (Model Context Protocol)** bridge that connects agentic frameworks (**Antigravity**, **OpenClaw**, **NemoClaw**) to a local **KoboldCpp** server. This setup is specifically optimized for utilizing an **NVIDIA RTX 3090** as a local computing workhorse, available even remotely via **Tailscale**.

---

### 🚀 Connector v1 Status
This repository is a **minimal usable connector v1**. It provides a robust, standardized interface to your local models.

**Key Features v1:**
- ✅ `healthcheck` — verify connection to the local 3090 endpoint.
- ✅ `config_info` — inspect currently active configurations and query profiles.
- ✅ `query_local_model` — robust chat request tool with improved error handling.
- ✅ `query_fast` / `query_deep` — built-in profiles for simple "short/fast" vs "thorough/deep" task separation.
- ✅ **Endpoint Normalization** — automatically handles `/v1` vs `/v1/chat/completions`.

---

## 🛠️ Installation (Step-by-Step)

### 1. Host Machine (Windows RTX 3090)
1. Run **[KoboldCPP v1.110](https://github.com/LostRuins/koboldcpp/releases/tag/v1.110)** or newer.
2. Load your model using the default config: `koboldcpp.exe --config C:\AI_Models\config_3090_DEFAULT.kcpps`.
3. **Crucial:** Ensure Kobold starts with `--corsorigin *` to allow browser-based dashboard access.

### 2. Client Side Setup (e.g., in your local Repo)
We recommend using a Virtual Environment to avoid dependency conflicts:

```powershell
# Create environment
python -m venv venv

# Install latest MCP & HTTTPX
./venv/Scripts/pip.exe install mcp httpx
```

### 3. Integration into Antigravity
Add this to your `mcp_config.json` (usually in `~/.gemini/antigravity/`):

```json
"kobold-nemotron-bridge": {
  "command": "E:/Path/to/Kobold-Claw-Link-MCP/venv/Scripts/python.exe",
  "args": ["E:/Path/to/Kobold-Claw-Link-MCP/router.py"],
  "env": {
    "KOBOLD_URL": "http://localhost:5001/v1",
    "KOBOLD_MODEL": "nemotron-cascade-2-30B",
    "KOBOLD_TIMEOUT": "180"
  }
}
```

---

## 🖥️ Web Interfaces (Port 8080 vs Port 5001)

Es gibt **zwei völlig unterschiedliche Web-Interfaces**, je nachdem, welchen Port Sie aufrufen. **Port 8080 ist das empfohlene Custom-Interface.**

### 🟢 `localhost:8080` (Kobold-Claw Custom UI)
Ein elegantes, lokales Web-Frontend im Glassmorphism-Stil, das speziell für dieses Projekt entwickelt wurde (befindet sich im Verzeichnis `/frontend`). Es bietet ein klassisches Layout (Sidebar links, offener Chat rechts), persistente Historie und detailliertes Agentic-Prompting (Edit, Delete, Regen).
**Starten:**
1. Starten Sie einen lokalen Webserver: `python -m http.server 8080 --directory frontend`
2. Öffnen Sie in Ihrem Browser: **`http://localhost:8080`**

### 🔴 `localhost:5001` (KoboldAI Lite)
Dies ist die **standardmäßig eingebaute Benutzeroberfläche**, die tief in der KoboldCPP `.exe` verankert ist. Sie wirkt oft überladen durch viele Pop-Up-Windows (z.B. Context Data) und Eingabefelder am unteren Rand.
**Wichtiger Hinweis:** Wenn Sie KoboldCPP starten und der Haken bei **"Launch Browser"** gesetzt ist (oder in der `config_3090_DEFAULT.kcpps` der Wert `"launch": true` steht), öffnet sich dieses Interface _automatisch_. 
**Lösung:** Schließen Sie diesen Tab einfach und wechseln Sie zu `8080`. Um das automatische Öffnen dauerhaft zu verhindern, entfernen Sie den Haken "Launch Browser" in der KoboldCPP-App.

---

## 🧬 Core Stack Reference
- **Recommended Models (Tested for 24GB VRAM):**
  - 🧠 **Heavy Reasoning (24k Context):** [Nemotron-Cascade-2-30B-A3B (IQ4_XS)](https://huggingface.co/mradermacher/Nemotron-Cascade-2-30B-A3B-GGUF)
  - 📚 **Long Context (128k Context):** [Llama-3.1-8B-Instruct (Q8_0)](https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q8_0.gguf)
  - 💻 **Heavy Coding (128k Context):** [Qwen2.5-Coder-7B-Instruct (Q8_0)](https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q8_0.gguf)
  - ⚡ **Speed RAG (4k Context):** [Nemotron-Mini-4B-Instruct (Q8_0)](https://huggingface.co/bartowski/Nemotron-Mini-4B-Instruct-GGUF/resolve/main/Nemotron-Mini-4B-Instruct-Q8_0.gguf)
- **SDK**: Built with the modern **FastMCP** (SDK 1.x) for better stability/type support.
- **Reference**: Inspired by [this tutorial](https://www.youtube.com/watch?v=H0IYyERZUyo).

*Created with ❤️ for high-performance agentic engineering.*
