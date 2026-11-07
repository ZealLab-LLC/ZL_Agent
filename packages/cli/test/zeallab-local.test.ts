import { expect, test } from "bun:test"
import path from "node:path"
import { tmpdir } from "../../core/test/fixture/tmpdir"
import { isolatedEnv } from "./fixture/environment"

function tag(model: string) {
  return {
    name: model,
    model,
    modified_at: "2026-01-01T00:00:00Z",
    size: 1,
    digest: model,
    details: { format: "gguf", family: "qwen", parameter_size: "1B", quantization_level: "Q4_K_M" },
  }
}

test("discovers only local Ollama models and ignores saved cloud provider endpoints", async () => {
  await using root = await tmpdir("zeallab-local-")
  const shown: string[] = []
  const completions: string[] = []
  using ollama = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const pathname = new URL(request.url).pathname
      if (pathname === "/api/tags") {
        await Bun.sleep(150)
        return Response.json({
          models: [tag("local:latest"), { ...tag("cloud:latest"), remote_host: "https://ollama.com" }],
        })
      }
      if (pathname === "/api/show") {
        const { model } = (await request.json()) as { model: string }
        shown.push(model)
        return Response.json({ capabilities: ["completion", "tools"] })
      }
      if (pathname === "/v1/chat/completions") {
        const { model } = (await request.json()) as { model: string }
        completions.push(model)
        const base = { id: "local", object: "chat.completion.chunk", created: 0, model }
        const chunk = (delta: object, finish_reason: string | null) =>
          `data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta, finish_reason }] })}\n\n`
        return new Response(
          chunk({ role: "assistant", content: "Local response" }, null) + chunk({}, "stop") + "data: [DONE]\n\n",
          { headers: { "content-type": "text/event-stream" } },
        )
      }
      return new Response(null, { status: 404 })
    },
  })
  const unexpected: string[] = []
  using cloud = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      unexpected.push(request.url)
      return new Response(null, { status: 500 })
    },
  })
  const config = path.join(root.path, "config", "zeallab.jsonc")
  await Bun.write(
    config,
    JSON.stringify({
      providers: {
        ollama: { package: "@opencode/ai/providers/openai-compatible", settings: { baseURL: cloud.url.href } },
        cloud: {
          package: "@opencode/ai/providers/openai-compatible",
          settings: { baseURL: cloud.url.href },
          models: { "configured-cloud": { name: "Cloud model" } },
        },
      },
    }),
  )
  const cwd = path.join(import.meta.dir, "..")
  const env = isolatedEnv(root.path, {
    ZEALLAB_OLLAMA_URL: ollama.url.href,
    ZEALLAB_ALLOW_NETWORK: undefined,
    ZEALLAB_ALLOW_REMOTE_PROVIDERS: undefined,
    OPENCODE_CONFIG_CONTENT: undefined,
    OPENCODE_MODELS_URL: cloud.url.href,
    OPENCODE_DISABLE_MODELS_FETCH: undefined,
  })
  async function run(...args: string[]) {
    const proc = Bun.spawn([process.execPath, "src/index.ts", ...args, "--standalone"], {
      cwd,
      env,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    })
    try {
      const [exitCode, stdout, stderr] = await Promise.all([
        proc.exited,
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ])
      return { exitCode, stdout, stderr }
    } finally {
      proc.kill()
    }
  }

  expect(await run("models")).toEqual({ exitCode: 0, stdout: "ollama/local:latest\n", stderr: "" })
  expect(shown).toEqual(["local:latest"])
  const result = await run("run", "--model", "ollama/local:latest", "Say hello")
  expect(result).toMatchObject({ exitCode: 0, stdout: expect.stringContaining("Local response") })
  expect(completions).toContain("local:latest")
  expect(unexpected).toEqual([])
}, 15_000)
