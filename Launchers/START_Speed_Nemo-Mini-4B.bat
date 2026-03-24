@echo off
echo Starting Speed_Nemo-Mini-4B with 4096 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Hardcoded to the user's new custom location C:\Kobold-Agent-Studio_LOCAL
set "CONFIG_PATH=%~dp0Speed_Nemo-Mini-4B.kcpps"
start "" "C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe" --config "%CONFIG_PATH%"
