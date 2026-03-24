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
2. Load your model (e.g., **[Nemotron-Cascade-2-30B IQ4_XS](https://huggingface.co/mradermacher/Nemotron-Cascade-2-30B-A3B-GGUF/tree/main)**).
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

## 🖥️ Web Interface (Claw-Chat Dashboard)
A sleek, glassmorphism-style web frontend is included in the `/frontend` directory for direct model interaction via browser.

**To Launch:**
1. Start a local server: `python -m http.server 8080 --directory frontend`
2. Access at: **`http://localhost:8080`**

---

## 🧬 Core Stack Reference
- **Engine**: [KoboldCPP](https://github.com/LostRuins/koboldcpp)
- **Model**: [Nemotron-Cascade-2-30B-A3B-GGUF](https://huggingface.co/mradermacher/Nemotron-Cascade-2-30B-A3B-GGUF)
- **SDK**: Built with the modern **FastMCP** (SDK 1.x) for better stability/type support.
- **Reference**: Inspired by [this tutorial](https://www.youtube.com/watch?v=H0IYyERZUyo).

*Created with ❤️ for high-performance agentic engineering.*
