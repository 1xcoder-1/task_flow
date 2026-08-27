---
name: shadcn-ui-skills
description: "Give your AI assistant deep knowledge of shadcn/ui components, patterns, and best practices."
risk: safe
source: official
date_added: "2026-04-30"
---

# shadcn/ui Skills

This skill empowers AI assistants with project-aware context about shadcn/ui. 

## Getting Started
To install the shadcn/ui skill into a project, run:
```bash
pnpm dlx skills add shadcn/ui
```
This enables the assistant to automatically load context when working with shadcn/ui components in that specific project.

## Project Context
The skill leverages `components.json` and runs `shadcn info --json` to understand:
- Framework & Tailwind version
- Aliases
- Base library (`radix` or `base`)
- Icon library
- Installed components

## Composition Patterns
Enforce standard shadcn/ui composition rules:
- Use `FieldGroup` for forms.
- Use `ToggleGroup` for option sets.
- Adhere to semantic colors.
- Use correct base-specific APIs.

## Commands
Familiarize yourself with the full suite of shadcn CLI commands:
- `init`: Initialize your project and install dependencies
- `add`: Add a component to your project
- `search`: Search for components in the registry
- `view`: View component documentation in the terminal
- `docs`: Open component documentation in the browser
- `diff`: Diff installed components against the registry
- `info`: Display project configuration
- `build`: Build registries for publishing

## Registry & MCP
- AI can browse and install components from registries via the shadcn MCP server.
- Registries use `registry.json` and `registry-item.json` specifications for distribution.
