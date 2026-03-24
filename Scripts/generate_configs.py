import json
import os
import shutil

base_config_path = r"C:\AI_Models\config_3090_DEFAULT.kcpps"
output_dir = r"E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers"
os.makedirs(output_dir, exist_ok=True)

# Read the base config to keep user's preferences intact
with open(base_config_path, 'r', encoding='utf-8') as f:
    base_data = json.load(f)

# Ensure the standard web UI is turned OFF in our templates
base_data["launch"] = False

models = [
    {
        "name": "Heavy_Nemotron-30B",
        "path": "C:/AI_Models/Nemotron-Cascade-2-30B-A3B.IQ4_XS.gguf",
        "ctx": 24576
    },
    {
        "name": "Coder_Qwen-7B",
        "path": "C:/AI_Models/Qwen2.5-Coder-7B-Instruct-Q8.gguf",
        "ctx": 128000
    },
    {
        "name": "LongContext_Llama-8B",
        "path": "C:/AI_Models/Llama-3.1-8B-Instruct-Q8.gguf",
        "ctx": 128000
    },
    {
        "name": "Speed_Nemo-Mini-4B",
        "path": "C:/AI_Models/Nemotron-Mini-4B-Instruct-Q8.gguf",
        "ctx": 4096
    }
]

for m in models:
    # Clone and modify data
    new_data = dict(base_data)
    new_data["model_param"] = m["path"]
    new_data["contextsize"] = m["ctx"]
    new_data["overridenativecontext"] = m["ctx"] # Override limits to absolute max allowed
    
    # Paths for config and launcher
    config_file = os.path.join(output_dir, f"{m['name']}.kcpps")
    bat_file = os.path.join(output_dir, f"START_{m['name']}.bat")
    
    # Save the custom config JSON
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)
        
    # Create the quick launch .bat script
    # Assumes koboldcpp is on user's PATH or needs absolute path. We assume starting via PATH or in same folder.
    # We will just write a standard launch script pointing to the config.
    # To be safe against different koboldcpp install locations, we use 'koboldcpp' assuming it's an environment variable,
    # OR we prompt user to fix the path later if it fails.
    bat_content = f"""@echo off
echo Starting {m['name']} with {m['ctx']} tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Using generic koboldcpp call. Adjust 'koboldcpp.exe' path if necessary.
start "" koboldcpp.exe --config "{config_file}"
"""
    with open(bat_file, 'w', encoding='utf-8') as f:
        f.write(bat_content)

print(f"Configurations and Launchers successfully created in {output_dir}")
