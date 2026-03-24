@echo off
echo Starting Speed_Nemo-Mini-4B with 4096 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Using generic koboldcpp call. Adjust 'koboldcpp.exe' path if necessary.
start "" koboldcpp.exe --config "E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\Speed_Nemo-Mini-4B.kcpps"
