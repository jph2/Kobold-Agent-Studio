import httpx
import time

KOBOLD_URL = 'http://localhost:5001/v1/chat/completions'

# Step 1: Build the giant haystack
print("Building 180k Token Haystack...")
filler_sentence = "Dieses System ist darauf ausgelegt, große Mengen an Daten zu verarbeiten und die Kapazität des Speichers zu testen. "
# 1 Token ~ 4 chars. Sentence has ~17 words. Let's aim for huge scale.
# ~50.000 Tokens (ca. 350.000 Zeichen) for heavy stress testing
haystack_part1 = filler_sentence * 1500
needle = " ACHTUNG NADEL: Das verborgene Codewort für dieses 50.000 Token-Stressexperiment lautet 'SCHATZKISTE'. "
haystack_part2 = filler_sentence * 1500

full_text = haystack_part1 + needle + haystack_part2

print(f"Text size built: {len(full_text):,} characters.")

# Step 2: The payload
payload = {
    "model": "nemotron-cascade-2",
    "messages": [
        {"role": "user", "content": full_text + "\n\nFrage: Wie lautet das verborgene Codewort in dem gesamten obigen Text? Antworte nur mit dem Wort."}
    ],
    "max_tokens": 100,
    "temperature": 0.1
}

# Step 3: Send ignoring read timeouts (since processing 200k tokens takes time)
print("Sending to 3090 (this might take a few minutes)...")
start_time = time.time()

try:
    with httpx.Client(timeout=600.0) as client:
        response = client.post(KOBOLD_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        
        end_time = time.time()
        print("\n=== TEST ERGEBNIS ===")
        print(f"Antwort: {data['choices'][0]['message']['content']}")
        
        usage = data.get('usage', {})
        print(f"Token Genutzt: {usage.get('total_tokens', 'Unknown')}")
        print(f"Dauer: {round(end_time - start_time, 2)} Sekunden.")
except Exception as e:
    print(f"Fehler beim Stress-Test: {e}")
