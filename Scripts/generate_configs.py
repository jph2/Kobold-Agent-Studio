import json
import os

base_config_path = r"E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\Heavy_Nemotron-30B.kcpps"
# OUTPUT TO REPO DIRECTORY FOR GIT TRACKING
output_dir = r"E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers"

with open(base_config_path, 'r', encoding='utf-8') as f:
    base_data = json.load(f)

# Ensure the standard web UI is turned OFF
base_data["launch"] = False

models = [
    {
        "name": "Heavy_Nemotron-30B",
        "path": "C:/Kobald_Claw_LOCAL/Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf",
        "ctx": 24576
    },
    {
        "name": "Coder_Qwen-7B",
        "path": "C:/Kobald_Claw_LOCAL/Qwen2.5-Coder-7B-Instruct-Q8.gguf",
        "ctx": 128000
    },
    {
        "name": "LongContext_Llama-8B",
        "path": "C:/Kobald_Claw_LOCAL/Llama-3.1-8B-Instruct-Q8.gguf",
        "ctx": 128000
    },
    {
        "name": "Speed_Nemo-Mini-4B",
        "path": "C:/Kobald_Claw_LOCAL/Nemotron-Mini-4B-Instruct-Q8.gguf",
        "ctx": 4096
    }
]

for m in models:
    new_data = dict(base_data)
    new_data["model_param"] = m["path"]
    new_data["contextsize"] = m["ctx"]
    new_data["overridenativecontext"] = m["ctx"] 
    
    config_file = os.path.join(output_dir, f"{m['name']}.kcpps")
    bat_file = os.path.join(output_dir, f"START_{m['name']}.bat")
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)
        
    bat_content = f"""@echo off
echo Starting {m['name']} with {m['ctx']} tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Hardcoded to the user's new custom location C:\\Kobald_Claw_LOCAL
set "CONFIG_PATH=%~dp0{os.path.basename(config_file)}"
start "" "C:\\Kobald_Claw_LOCAL\\koboldcpp.exe" --config "%CONFIG_PATH%"
"""
    with open(bat_file, 'w', encoding='utf-8') as f:
        f.write(bat_content)

print(f"Configurations and Launchers successfully re-generated in {output_dir}")
