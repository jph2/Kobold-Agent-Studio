# Kobold Agent Studio

Kobold Agent Studio is a local AI control panel for people who want more independence.

The point is simple:
- run useful models on your own machine
- keep your chats and files local
- switch between different local models depending on the job
- avoid sending everything to frontier-model providers when you do not want to
- run local agents efficiently for specific tasks

It is not magic. It is a practical local setup.

## Why this exists

A lot of AI tooling assumes you should always depend on online services. That is convenient, but it also means less control, less privacy, and more lock-in.

This project takes the opposite direction:
- your machine does the work
- your data can stay on your machine
- you decide which local model to run
- you can keep using it as a standalone system

That is a good direction for normal humans who want a bit more control over their tools.

It is also a good direction for agentic systems.

A useful pattern now is:
- a frontier model acts as the main planning and structuring system
- smaller local models handle narrower tasks on local hardware
- the overall system becomes cheaper, more energy-efficient, and often more privacy-compliant

That is one of the main reasons this project matters.

## What it does

Kobold Agent Studio gives you:
- a browser-based local chat dashboard
- model switching through a simple local orchestrator
- local chat history saving
- a basic bridge for agent-style workflows
- optional web search context
- a practical way to run local helper agents for selected tasks

## Why local agents matter

The newer smaller models are now good enough to do certain kinds of work efficiently on local hardware.

That does **not** mean they replace frontier models for everything.

A more realistic and useful pattern is:
- use a stronger frontier model for planning, decomposition, structure, and overall coordination
- send selected sub-tasks to smaller local agents
- let those local agents do narrow work on your own machine

That can save money, reduce energy waste, and keep more sensitive work local.

So this project is not just for a human sitting in a browser chat.
It is also useful as a local execution layer for broader agent systems.

## Important honesty section

The online search really sucks.

Right now it is a fragile scrape of DuckDuckGo Lite. It is basic, brittle, and should not be treated as a serious research system. Sometimes it may help a little. Sometimes it will be noisy, incomplete, or just fail.

So the actual value of this project is **not** the web search.

The actual value is that it works as a **standalone local AI station** that can give people more privacy, more control, and less dependence on frontier-model platforms.

## Models

The included setup is aimed at local GGUF-style workflows, but the bigger idea is broader than that.

You can add other models too.

And if you have stronger hardware, you are not limited to small quantized models. You can adapt this project for larger or higher-quality local setups as long as your machine can actually carry the load.

So treat the included model list as a starting point, not as a hard limit.

## Hardware expectations

This project makes the most sense on a machine with a decent NVIDIA GPU and enough VRAM for local inference.

A strong local machine gives you:
- better model choices
- better speed
- less compromise on quantization
- a more useful standalone setup overall

## How to start

1. Clone this repository.
2. Make sure your local KoboldCpp setup and model files are configured the way you want.
3. Start the orchestrator:

```bash
venv\Scripts\python.exe orchestrator.py
```

4. Open:

```text
http://localhost:8080/
```

## Security defaults

The orchestrator now defaults to **localhost only**.

Optional environment variables:
- `KAS_BIND_HOST` — change the bind host if you intentionally want remote access
- `KAS_PORT` — change the port (default `8080`)
- `KAS_TOKEN` — required if you want to allow remote control requests to sensitive endpoints

If you expose this beyond localhost, do it deliberately. Local-first is safer. Casual LAN exposure is sloppy.

## Human use and agent use

This project should work in two directions:

### 1. Human use
For humans, it should provide a privacy-compliant local way to:
- chat with local models
- switch models for different jobs
- keep more work on their own machine
- reduce dependence on online AI providers

### 2. Agent use
For agents, it should provide a framework that can be integrated into:
- IDE workflows
- local harnesses
- routing/orchestration systems
- tools like OpenClaw and similar agent environments

That means the project should be useful both as:
- a direct interface for a human
- a local capability layer that another agent system can call into

## What this project is good for

- private local chatting
- testing local model workflows
- switching between specialized local models
- basic local agent experiments
- running smaller local agents under a larger orchestrated system
- keeping more of your AI usage on your own hardware
- supporting IDE and harness integrations for local execution

## What this project is not

- not a polished enterprise platform
- not a hardened security product
- not a reliable web research stack
- not a replacement for careful system administration

## Contributing

If you want to improve this project, contribute.

Useful contribution areas:
- make the setup clearer for non-technical users
- improve model configuration and switching
- replace the weak web search with something less flimsy
- tighten security
- improve file/path handling
- improve the local UX
- improve IDE / harness integration paths
- make local-agent workflows easier to use and extend

Pull requests, cleanup, documentation improvements, and practical fixes are welcome.

## Security note

This is local-first software, but local does **not** automatically mean secure.

If you expose it on your network, treat it like a tool that still needs hardening. Review the code, restrict access, and do not assume the current version is safe by default.

## Final summary

Kobold Agent Studio is worth keeping around because the core idea is good:

**a standalone local AI control station that gives humans more privacy, more independence, and more control over their own machine — while also giving agent systems a useful local execution layer for smaller, cheaper, more privacy-friendly tasks.**

The web search is weak. The project still has rough edges. But the direction is solid.
