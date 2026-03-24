# Kobold-Claw-Link-MCP 🔗

Ein hochperformanter MCP-Router, der agentische Frameworks (**Antigravity**, **OpenClaw**, **NemoClaw**) mit einem lokalen **KoboldCPP**-Inferenz-Server verbindet. Optimiert für die Nutzung einer **NVIDIA RTX 3090** (24GB VRAM).

## Features
- 🚀 **Full GPU Offload**: Nutzt Nemotron-Cascade-2 (30B) via KoboldCPP (IQ4_XS Quantisierung).
- 🧠 **Context Optimization**: Unterstützung für bis zu 32k Context-Fenster dank Flash-Attention.
- 🌐 **Remote Access**: Nahtlose Verbindung über **Tailscale** für Laptop-Zugriff von überall.
- 🛠️ **FastMCP Integration**: Erkennt Tools und Modelle automatisch für Agenten.

## Installation & Setup

### 1. Auf dem Host (Windows mit 3090)
1. Installiere [KoboldCPP](https://github.com/LostRuins/koboldcpp).
2. Lade das Modell `Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf` herunter.
3. Starte KoboldCPP (standardmäßig auf Port 5001).

### 2. Auf dem Client (Laptop / Antigravity)
1. Klone dieses Repository.
2. Installiere die Abhängigkeiten:
   ```bash
   pip install mcp httpx
   ```
3. Füge den Router zu deiner `mcp_config.json` hinzu:
   ```json
   "kobold-nemotron-router": {
       "command": "python",
       "args": ["E:/Pfad/zu/Kobold-Claw-Link-MCP/router.py"],
       "env": {
           "KOBOLD_URL": "http://localhost:5001/v1/chat/completions"
       }
   }
   ```

## Netzwerk-Zugriff (Tailscale)
Um von einem Ubuntu-Laptop auf die 3090 zuzugreifen, ändere die `KOBOLD_URL` in deiner Config auf die Tailscale-IP deines PCs:
```json
"env": {
    "KOBOLD_URL": "http://100.x.y.z:5001/v1/chat/completions"
}
```

## References & Acknowledgments
Die Grundidee zur Einbindung lokaler LLMs als MCP-Server in Antigravity wurde durch folgendes Tutorial inspiriert:
- [Expanding Antigravity LLM catalog with Local Models (YouTube)](https://www.youtube.com/watch?v=H0IYyERZUyo)

---
*Created with ❤️ for high-performance agentic engineering.*
