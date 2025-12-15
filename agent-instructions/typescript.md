### TypeScript and JavaScript

- Use the workspace tsconfig base via @repo/typescript-config . Use the base tsconfig to define broad type-checking rules, and define build-specific rules that exempt e.g. tests in a package-local extended `tsconfig.build.json`.
- Use TypeScript with explicit types (avoid `any`)
- Prefix unused variables with underscore (\_varName)
- Always camelCase for variables, functions, classes (PascalCase), etc.
- Prefer named functions over anonymous functions assigned to named consts.
- Prefer named classes over anonymous objects assigned to named consts.
- ALWAYS use `type =` over `interface` unless the desired functionality is impossible with type aliases.
- ALWAYS use string type unions over enums unless enums bring something that can't be achieved with type unions.
- Avoid types files or directories; instead define and, IF NEEDED, export, types from the files where the corresponding data is actually being managed.
- This also means NOT DEFINING TYPES IN TOP-LEVEL FILES---they should be defined in the file where most of the interaction with data of that type happens.
- Prefer using comprehensive union types over optional properties in places where a type can cover all possibilities while avoiding optionality.
- NEVER USE || where ?? can do the same job!
- For errors: Use try/catch blocks and provide helpful error messages.
- Validate all data using zod, and use it to confirm types. NEVER cast JSON objects using `as`, ALWAYS use zod validation. Use zod v4 as described in https://zod.dev/v4 .
- NEVER use bare `JSON.parse`, as this infers an `any` type for the returns; ALWAYS run these through zod validation to get full typing.
- When logging with @repo/logger, include the message as a `message` key rather than a bare string so that JSON indexers for observability pick it up right.

## Specific packages

- Use @repo/logger rather than the console for logging. The logger is configured to automatically emit JSON when running in production/workers environments and pretty print in development/local environments.
- Use i18next for all i18n needs.
