/**
 * Side-effecting entrypoint: applies ZealLab Agent's local-only environment
 * defaults. Imported as the very first import of src/index.ts so that it runs
 * before @opencode-ai/core's Flag module snapshots process.env.
 */
import { bootstrap } from "./index"

bootstrap()
