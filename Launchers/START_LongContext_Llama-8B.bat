@echo off
echo Starting LongContext_Llama-8B with 128000 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Using generic koboldcpp call. Adjust 'koboldcpp.exe' path if necessary.
start "" koboldcpp.exe --config "E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\LongContext_Llama-8B.kcpps"
