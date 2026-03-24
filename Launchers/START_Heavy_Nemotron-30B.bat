@echo off
echo Starting Heavy_Nemotron-30B with 24576 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Hardcoded to the user's new custom location C:\Kobold-Agent-Studio_LOCAL
set "CONFIG_PATH=%~dp0Heavy_Nemotron-30B.kcpps"
start "" "C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe" --config "%CONFIG_PATH%"
