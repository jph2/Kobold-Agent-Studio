@echo off
echo Starting Heavy_Nemotron-30B with 24576 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Using generic koboldcpp call. Adjust 'koboldcpp.exe' path if necessary.
start "" koboldcpp.exe --config "E:\SynologyDrive\9999_LocalRepo\Kobold-Claw-Link-MCP\Launchers\Heavy_Nemotron-30B.kcpps"
