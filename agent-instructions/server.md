# Cloudflare workers and other server environments

- Respect all rules in typescript.md .
- Don't provide deep error messages in HTTP responses; log them and provide a high-level error to the client.
- Use @repo/logger rather than the console for logging. The logger automatically emits JSON in production/workers environments and pretty prints in development environments.
