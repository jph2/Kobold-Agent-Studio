@echo off
echo Starting Coder_Qwen-7B with 128000 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Using generic koboldcpp call. Adjust 'koboldcpp.exe' path if necessary.
start "" koboldcpp.exe --config "E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\Coder_Qwen-7B.kcpps"
