import json
import os
import re
import secrets
import subprocess
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
LAUNCHERS_DIR = os.path.join(BASE_DIR, 'Launchers')
CHAT_HISTORY_DIR = r"C:\Kobold-Agent-Studio_LOCAL\Chat-History"

if not os.path.exists(CHAT_HISTORY_DIR):
    os.makedirs(CHAT_HISTORY_DIR)

LAST_HEARTBEAT = time.time()
TIMEOUT_SECONDS = 900
MAX_BODY_BYTES = 1024 * 1024
DEFAULT_BIND_HOST = os.getenv("KAS_BIND_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.getenv("KAS_PORT", "8080"))
ORCHESTRATOR_TOKEN = os.getenv("KAS_TOKEN", "")
SAFE_SESSION_RE = re.compile(r"[^A-Za-z0-9._-]+")
ALLOWED_ORIGIN_RE = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", re.IGNORECASE)


def auto_shutdown_monitor():
    global LAST_HEARTBEAT
    while True:
        time.sleep(30)
        if time.time() - LAST_HEARTBEAT > TIMEOUT_SECONDS:
            LAST_HEARTBEAT = time.time()
            print("💤 [IDLE TIMEOUT] No active UI pings found for 15 minutes. Purging GPU VRAM...")
            os.system('taskkill /F /IM koboldcpp.exe >nul 2>&1')


threading.Thread(target=auto_shutdown_monitor, daemon=True).start()

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
        "speed": "Slow 🐢",
        "pros": "Absolute benchmark for coherent roleplay, deep nuances, and flawless long German.",
        "cons": "Heavy on the VRAM, slightly slower generation.",
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
    daemon_threads = True


class OrchestratorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def _request_origin_allowed(self):
        origin = self.headers.get('Origin', '').strip()
        if not origin:
            return True
        return bool(ALLOWED_ORIGIN_RE.match(origin))

    def end_headers(self):
        origin = self.headers.get('Origin', '').strip()
        if origin and self._request_origin_allowed():
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-KAS-Token')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def _read_json(self):
        content_length_raw = self.headers.get('Content-Length', '0')
        try:
            content_length = int(content_length_raw)
        except ValueError:
            self._send_json({"error": "invalid Content-Length"}, 400)
            return None

        if content_length < 0 or content_length > MAX_BODY_BYTES:
            self._send_json({"error": "request too large"}, 413)
            return None

        try:
            raw = self.rfile.read(content_length)
            return json.loads(raw.decode('utf-8'))
        except json.JSONDecodeError:
            self._send_json({"error": "invalid json body"}, 400)
            return None
        except UnicodeDecodeError:
            self._send_json({"error": "request must be utf-8 json"}, 400)
            return None

    def _require_local_or_token(self):
        client_ip = self.client_address[0]
        if client_ip in ('127.0.0.1', '::1'):
            return True

        if not self._request_origin_allowed():
            self._send_json({"error": "origin not allowed"}, 403)
            return False

        if ORCHESTRATOR_TOKEN:
            supplied = self.headers.get('X-KAS-Token', '')
            if secrets.compare_digest(supplied, ORCHESTRATOR_TOKEN):
                return True

        self._send_json({"error": "forbidden"}, 403)
        return False

    def _sanitize_session_id(self, raw_session_id):
        session_id = str(raw_session_id or 'unknown_session').strip()
        session_id = SAFE_SESSION_RE.sub('_', session_id)
        session_id = session_id.strip('._-') or 'unknown_session'
        return session_id[:120]

    def _safe_launcher_path(self, bat_name):
        candidate = os.path.abspath(os.path.join(LAUNCHERS_DIR, bat_name))
        launchers_root = os.path.abspath(LAUNCHERS_DIR) + os.sep
        if not candidate.startswith(launchers_root):
            raise ValueError('invalid launcher path')
        if not os.path.isfile(candidate):
            raise FileNotFoundError(f'launcher not found: {os.path.basename(candidate)}')
        return candidate

    def do_OPTIONS(self):
        if not self._request_origin_allowed():
            self._send_json({"error": "origin not allowed"}, 403)
            return
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        global LAST_HEARTBEAT

        if self.path == '/api/ping':
            LAST_HEARTBEAT = time.time()
            self._send_json({"status": "alive"})
            return

        if self.path == '/api/models':
            self._send_json(MODELS)
            return

        super().do_GET()

    def do_POST(self):
        if self.path == '/api/save_history':
            if not self._require_local_or_token():
                return

            req = self._read_json()
            if req is None:
                return

            session_id = self._sanitize_session_id(req.get('session_id', 'unknown_session'))
            messages = req.get('messages', [])
            if not isinstance(messages, list):
                self._send_json({"error": "messages must be a list"}, 400)
                return

            md_content = f"# 🧠 Persistent Memory Log: {session_id}\n\n"
            for m in messages[:500]:
                role = "User 👤" if m.get('role') == 'user' else "Agent 🤖"
                content = str(m.get('content', ''))[:20000]
                md_content += f"## {role}\n\n{content}\n\n---\n\n"

            filepath = os.path.join(CHAT_HISTORY_DIR, f"{session_id}.md")
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(md_content)
                self._send_json({"status": "saved", "session_id": session_id})
            except Exception:
                self._send_json({"error": "failed to save history"}, 500)
            return

        if self.path == '/api/poweroff':
            if not self._require_local_or_token():
                return

            print("🛑 [KILLSWITCH] Manual override initiated. Purging GPU VRAM...")
            os.system('taskkill /F /IM koboldcpp.exe >nul 2>&1')
            self._send_json({"status": "shutdown"})
            return

        if self.path == '/api/search':
            if not self._require_local_or_token():
                return

            req = self._read_json()
            if req is None:
                return

            query = str(req.get('query', '')).strip()
            if not query:
                self._send_json({"error": "query must not be empty"}, 400)
                return
            query = query[:500]

            import re as _re
            import urllib.parse
            import urllib.request

            try:
                data = urllib.parse.urlencode({'q': query}).encode('utf-8')
                req_obj = urllib.request.Request(
                    'https://lite.duckduckgo.com/lite/',
                    data=data,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                )
                html = urllib.request.urlopen(req_obj, timeout=5).read().decode('utf-8')
                chunks = html.split("class='result-snippet'")

                results = []
                for i in range(1, len(chunks)):
                    snip_match = _re.search(r'^[^>]*>(.*?)</td>', chunks[i], _re.I | _re.S)
                    if not snip_match:
                        continue

                    snippet = _re.sub('<[^<]+>', '', snip_match.group(1)).strip()
                    url_match = _re.findall(r'href=[\'"]([^\'"]+)[\'"][^>]*class=[\'"]?result-url', chunks[i - 1], _re.I)
                    url = url_match[-1] if url_match else ""
                    if url.startswith('/url?q='):
                        url = url.replace('/url?q=', '')

                    parsed = urlparse(url)
                    safe_url = url if parsed.scheme in ('http', 'https') else ''

                    if snippet:
                        if safe_url:
                            results.append(f"- Quelle: [{safe_url}]({safe_url}) | Auszug: {snippet}")
                        else:
                            results.append(f"- Auszug: {snippet}")

                context_str = "\n".join(results[:5])
                self._send_json({"results": context_str})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        if self.path == '/api/switch':
            if not self._require_local_or_token():
                return

            req = self._read_json()
            if req is None:
                return

            target_model = req.get('model_id')
            if target_model not in MODELS:
                self._send_json({"error": "unknown model_id"}, 400)
                return

            print(f"\n--- MODEL SWITCH TRIGGERED: {target_model} ---")
            print("1. Terminating existing Kobold processes...")
            os.system('taskkill /F /IM koboldcpp.exe >nul 2>&1')
            time.sleep(2)

            try:
                bat_path = MODELS[target_model].get('bat', '')
                full_bat_path = self._safe_launcher_path(bat_path)
            except ValueError:
                self._send_json({"error": "invalid launcher mapping"}, 500)
                return
            except FileNotFoundError as e:
                self._send_json({"error": str(e)}, 500)
                return

            print(f"2. Launching new Model: {full_bat_path}")
            subprocess.Popen(
                ['cmd.exe', '/c', full_bat_path],
                cwd=LAUNCHERS_DIR,
                creationflags=16,
            )

            self._send_json({"status": "starting", "message": f"{target_model} booting..."})
            return

        self._send_json({"error": "not found"}, 404)


if __name__ == '__main__':
    server = ThreadingSimpleServer((DEFAULT_BIND_HOST, DEFAULT_PORT), OrchestratorHandler)
    print("=" * 60)
    print("🚀 KOBOLD AGENT STUDIO ORCHESTRATOR")
    print(f"📂 RUNNING FROM REPO DIRECTORY: {os.path.abspath(__file__)}")
    print("=" * 60)
    print(f"Server binding to http://{DEFAULT_BIND_HOST}:{DEFAULT_PORT}")
    if ORCHESTRATOR_TOKEN:
        print("Control endpoints allow remote access only with X-KAS-Token.")
    else:
        print("No KAS_TOKEN set. Remote control endpoints stay local-only.")
    server.serve_forever()
