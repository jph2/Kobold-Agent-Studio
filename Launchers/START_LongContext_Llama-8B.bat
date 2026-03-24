@echo off
echo Starting LongContext_Llama-8B with 128000 tokens context window...
echo Ensure the previous KoboldCPP window is closed before starting this one!
:: Hardcoded to the user's new custom location C:\Kobold-Agent-Studio_LOCAL
set "CONFIG_PATH=%~dp0LongContext_Llama-8B.kcpps"
start "" "C:\Kobold-Agent-Studio_LOCAL\koboldcpp.exe" --config "%CONFIG_PATH%"
