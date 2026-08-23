import { Effect } from "effect"
import { define } from "../internal"

/**
 * Ollama provider for ZealLab Agent.
 *
 * Owned by the ZealLab fork — upstream opencode has no ollama.ts, so this file
 * never conflicts on a merge. It builds the model catalog entirely from the
 * local Ollama daemon (`/api/tags`), so no remote model catalog is required and
 * the agent works with no internet connection at all.
 *
 * Ollama is assumed to be installed and running. If it is unreachable the
 * catalog is left empty and the UI reports that no models are available, rather
 * than failing to boot.
 *
 * Mirrors the shapes used by plugin/models-dev.ts, which is the reference
 * implementation for populating the catalog.
 */

export const PROVIDER_ID = "ollama"

/** Base URL of the local Ollama daemon. */
export function baseUrl() {
  const raw = process.env["ZEALLAB_OLLAMA_URL"] || process.env["OLLAMA_HOST"] || "http://localhost:11434"
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`
  return withScheme.replace(/\/+$/, "")
}

/** Ollama exposes an OpenAI-compatible surface at /v1. */
const AISDK_PACKAGE = "@ai-sdk/openai-compatible"

/** Used when Ollama does not report a context length for a model. */
const FALLBACK_CONTEXT = 8192

type OllamaTag = {
  name?: string
  model?: string
  details?: {
    family?: string
    parameter_size?: string
    quantization_level?: string
    context_length?: number
  }
  capabilities?: string[]
}

/** Local inference is free — a fresh zero-cost entry per model. */
function free() {
  return [{ input: 0, output: 0, cache: { read: 0, write: 0 } }]
}

function displayName(id: string) {
  return id.endsWith(":latest") ? id.slice(0, -":latest".length) : id
}

async function listModels(): Promise<OllamaTag[]> {
  try {
    const res = await fetch(`${baseUrl()}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const body = (await res.json()) as { models?: OllamaTag[] }
    return body.models ?? []
  } catch {
    return []
  }
}

export const OllamaPlugin = define({
  id: "zeallab-ollama",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.catalog.transform(
      Effect.fn(function* (catalog) {
        const models = yield* Effect.promise(() => listModels())
        if (models.length === 0) return

        const url = `${baseUrl()}/v1`
        catalog.provider.update(PROVIDER_ID, (provider) => {
          provider.name = "Ollama (local)"
          provider.api = {
            type: "aisdk",
            package: AISDK_PACKAGE,
            url,
          }
        })

        for (const item of models) {
          const id = item.model ?? item.name
          if (!id) continue
          const caps = item.capabilities ?? []
          const context = item.details?.context_length ?? FALLBACK_CONTEXT
          catalog.model.update(PROVIDER_ID, id, (model) => {
            model.name = displayName(id)
            model.api = {
              id,
              type: "aisdk",
              package: AISDK_PACKAGE,
              url,
            }
            model.capabilities = {
              tools: caps.includes("tools"),
              input: caps.includes("vision") ? ["text", "image"] : ["text"],
              output: ["text"],
            }
            model.variants = []
            model.time.released = 0
            model.cost = free()
            model.status = "active"
            model.enabled = true
            model.limit = {
              context,
              output: Math.min(Math.max(Math.floor(context / 4), 1024), 32768),
            }
          })
        }

        // Point the default at a local model so a fresh install starts usable.
        const current = catalog.model.default.get()
        if (!current || current.providerID !== PROVIDER_ID) {
          const preferred = models.find((m) => (m.capabilities ?? []).includes("tools")) ?? models[0]
          const id = preferred?.model ?? preferred?.name
          if (id) catalog.model.default.set(PROVIDER_ID, id)
        }
      }),
    )
  }),
})
