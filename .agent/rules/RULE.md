---
trigger: always_on
---

# Development Rules

- **Do not modify AI prompts** within the code unless explicitly requested by the user.
- **Use the v0 MCP server** for all Frontend development tasks.
- **Encapsulate reusable logic** into shared functions, components, or modules to promote code reuse whenever existing logic can be applied.
- **Minimize the use of `any` types**; implement proper, reusable TypeScript types and interfaces to ensure type safety and maintainability.
- **Preserve user comments** in the code; do not delete or modify them under any circumstances.
- **Manage packages using pnpm** as the primary package manager.
- **Do not read .env files**; assume the environment configuration is correct and proceed with the task.
- **Avoid using magic numbers**; define meaningful constants for numerical values to improve code readability and maintainability.
