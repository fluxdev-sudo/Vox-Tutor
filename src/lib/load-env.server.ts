// Vite's dev SSR module runner doesn't reliably share process.env with the CLI
// process that evaluates vite.config.ts, so load .env again right where secrets
// are actually read. Calling this more than once per process is harmless.
try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if secrets are set as real environment variables instead.
}
