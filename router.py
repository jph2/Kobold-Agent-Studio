import os
import asyncio
import httpx
from mcp.server.fast import FastMCP

# Erstelle den MCP Server
mcp = FastMCP("Kobold-Claw-Link-MCP")

# Standardmaessig Localhost, kann aber via Umgebungsvariable oder Direkt-Edit (fuer Tailscale) geaendert werden
# Beispiel fuer Tailscale: "http://100.x.y.z:5001/v1/chat/completions"
KOBOLD_URL = os.getenv("KOBOLD_URL", "http://localhost:5001/v1/chat/completions")

@mcp.tool()
async def query_local_model(prompt: str) -> str:
    """
    Send prompt to local Nemotron-Cascade-2 (30B) via KoboldCPP.
    Optimized for high-performance agentic workflows (RTX 3090, 24GB VRAM).
    Use this for code analysis, private research, and complex reasoning tasks.
    """
    payload = {
        "model": "nemotron-cascade-2",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 4096
    }
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post(KOBOLD_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            # Safety check for message response structure
            if "choices" in result and len(result["choices"]) > 0:
                return str(result["choices"][0]["message"]["content"])
            return "Fehler: Unerwartetes Antwortformat vom Modell."
        except Exception as e:
            return f"Fehler bei der Verbindung zum lokalen Modell ({type(e).__name__}): {str(e)}"

if __name__ == "__main__":
    mcp.run()
