@echo off
echo Starting Coder_Qwen-7B with 128000 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Hardcoded to the user's new custom location C:\Kobold-Agent-Studio_LOCAL
set "CONFIG_PATH=%~dp0Coder_Qwen-7B.kcpps"
start "" "C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe" --config "%CONFIG_PATH%"
