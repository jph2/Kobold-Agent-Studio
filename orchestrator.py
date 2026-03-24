import os
import json
import subprocess
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
LAUNCHERS_DIR = os.path.join(BASE_DIR, 'Launchers')
CHAT_HISTORY_DIR = os.path.join(BASE_DIR, 'Chat-History')

if not os.path.exists(CHAT_HISTORY_DIR):
    os.makedirs(CHAT_HISTORY_DIR)

# Auto-Timeout Mechanism (15 Minutes)
LAST_HEARTBEAT = time.time()
TIMEOUT_SECONDS = 900 

def auto_shutdown_monitor():
    global LAST_HEARTBEAT
    while True:
        time.sleep(30)
        # If Kobold is loaded but there have been no visual UI pings for 15 mins
        if time.time() - LAST_HEARTBEAT > TIMEOUT_SECONDS:
            # Prevent spamming kills if already offline
            LAST_HEARTBEAT = time.time()
            print("💤 [IDLE TIMEOUT] No active network instances found for 15 minutes. Purging GPU VRAM...")
            os.system('taskkill /F /IM koboldcpp.exe >nul 2>&1')

# Boot daemon thread
threading.Thread(target=auto_shutdown_monitor, daemon=True).start()

# Central Model Registry with UI Metadata
MODELS = {
    "Coder_Qwen-7B": {
        "id": "Coder_Qwen-7B",
        "name": "Qwen2.5 Coder 7B",
        "context": 128000,
        "speed": "Fast ⚡",
        "pros": "Unbeatable coding, logic, and massive 128k context extraction.",
        "cons": "Not designed for creative writing or German poetry.",
        "bat": "START_Coder_Qwen-7B.bat"
    },
    "LongContext_Llama-8B": {
        "id": "LongContext_Llama-8B",
        "name": "Llama-3.1 8B",
        "context": 128000,
        "speed": "Fast ⚡",
        "pros": "Amazing generalist, handles extremely large documents (128k).",
        "cons": "Jack of all trades, master of none.",
        "bat": "START_LongContext_Llama-8B.bat"
    },
    "Heavy_Nemotron-30B": {
        "id": "Heavy_Nemotron-30B",
        "name": "Nemotron-Cascade 30B",
        "context": 24576,
        "speed": "Slow 🐢",
        "pros": "Unrivaled deep reasoning, perfect for complex NLP and logic.",
        "cons": "Slow generation, limited 24k context window.",
        "bat": "START_Heavy_Nemotron-30B.bat"
    },
    "Speed_Nemo-Mini-4B": {
        "id": "Speed_Nemo-Mini-4B",
        "name": "Nemotron-Mini 4B",
        "context": 4096,
        "speed": "Instant 🚀",
        "pros": "Lightning fast RAG and simple QA. Instant latency.",
        "cons": "Tiny 4k context window, low complex reasoning.",
        "bat": "START_Speed_Nemo-Mini-4B.bat"
    }
}

class ThreadingSimpleServer(ThreadingMixIn, HTTPServer):
    pass

class OrchestratorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve frontend files when requesting root
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        global LAST_HEARTBEAT
        
        # UI Heartbeat Ping
        if self.path == '/api/ping':
            LAST_HEARTBEAT = time.time()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "alive"}).encode('utf-8'))
            return
            
        # Serve the Model Registry as JSON API
        if self.path == '/api/models':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(MODELS).encode('utf-8'))
            return
        
        # Fallback to serving static files (index.html etc)
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/save_history':
            content_length = int(self.headers['Content-Length'])
            req = json.loads(self.rfile.read(content_length).decode('utf-8'))
            
            session_id = req.get('session_id', 'unknown_session')
            messages = req.get('messages', [])
            
            md_content = f"# 🧠 Persistent Memory Log: {session_id}\n\n"
            for m in messages:
                role = "User 👤" if m.get('role') == 'user' else "Agent 🤖"
                content = m.get('content', '')
                md_content += f"## {role}\n\n{content}\n\n---\n\n"
            
            filepath = os.path.join(CHAT_HISTORY_DIR, f"{session_id}.md")
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(md_content)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"saved"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            return

        if self.path == '/api/poweroff':
            print("🛑 [KILLSWITCH] Manual network override initiated. Purging GPU VRAM...")
            os.system('taskkill /F /IM koboldcpp.exe >nul 2>&1')
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "shutdown"}).encode('utf-8'))
            return
            
        if self.path == '/api/search':
            content_length = int(self.headers['Content-Length'])
            req = json.loads(self.rfile.read(content_length).decode('utf-8'))
            query = req.get('query', '')
            
            import urllib.request
            import urllib.parse
            import re
            
            try:
                # Basic DDG html scrape to bypass heavy deps
                url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
                req_obj = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                html = urllib.request.urlopen(req_obj, timeout=5).read().decode('utf-8')
                
                # Extract snippets
                snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
                
                # Clean HTML tags from snippet
                results = []
                for s in snippets[:3]:
                    clean = re.sub('<[^<]+>', '', s).strip()
                    results.append(clean)
                    
                context_str = " ".join(results)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"results": context_str}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/switch':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req = json.loads(post_data.decode('utf-8'))
            
            target_model = req.get('model_id')
            if target_model in MODELS:
                print(f"\\n--- MODEL SWITCH TRIGGERED: {target_model} ---")
                
                # 1. Kill Koboldcpp gracefully or hard
                print("1. Terminating existing Kobold processes...")
                os.system('taskkill /F /IM koboldcpp.exe')
                time.sleep(2)  # Wait for VRAM to clear
                
                # 2. Start new bat file
                bat_path = os.path.join(LAUNCHERS_DIR, MODELS[target_model]['bat'])
                print(f"2. Launching new Model: {bat_path}")
                
                # Use subprocess to launch in detached mode
                subprocess.Popen(f'cmd.exe /c "{bat_path}"', cwd=LAUNCHERS_DIR, creationflags=subprocess.CREATE_NEW_CONSOLE)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "starting", "message": f"{target_model} booting..."}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    port = 8080
    server = ThreadingSimpleServer(('0.0.0.0', port), OrchestratorHandler)
    print(f"🚀 Kobold-Claw Orchestrator running on http://127.0.0.1:{port}")
    print("Serving UI and Backend Models API. Press Ctrl+C to stop.")
    server.serve_forever()
