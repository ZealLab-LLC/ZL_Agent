import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { baseUrl, PROVIDER_ID } from "@opencode-ai/core/plugin/provider/ollama"

/**
 * Ollama models for the v1 provider service.
 *
 * Owned by the ZealLab fork — upstream has no counterpart, so this file never
 * conflicts on a merge.
 *
 * The fork already has core/plugin/provider/ollama.ts, but that populates the
 * **v2 catalog**. The model picker in the TUI reads the **v1** provider service
 * (`/config/providers` -> `Provider.list()`), which builds its models from the
 * models.dev database plus these `provider.models` hooks. Without a v1 hook the
 * picker only ever showed whatever static model list models.dev happened to
 * publish for Ollama — never the models actually pulled on this machine.
 *
 * Pairs with brand/models-dev-ollama.json, which supplies the single `ollama`
 * entry the v1 service requires before any hook for it is consulted.
 */

const FALLBACK_CONTEXT = 8192

type OllamaTag = {
  name?: string
  model?: string
  details?: { context_length?: number }
  capabilities?: string[]
}

function displayName(id: string) {
  return id.endsWith(":latest") ? id.slice(0, -":latest".length) : id
}

export async function ZealLabOllamaPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    provider: {
      id: PROVIDER_ID,
      async models(provider) {
        let tags: OllamaTag[] = []
        try {
          const res = await fetch(`${baseUrl()}/api/tags`, { signal: AbortSignal.timeout(5000) })
          if (res.ok) tags = ((await res.json()) as { models?: OllamaTag[] }).models ?? []
        } catch {
          // Daemon down: fall through to whatever the provider already had, so
          // the UI reports "no models" rather than failing to start.
        }
        if (tags.length === 0) return provider.models

        const url = `${baseUrl()}/v1`
        const models: Record<string, any> = {}
        for (const tag of tags) {
          const id = tag.model ?? tag.name
          if (!id) continue
          const caps = tag.capabilities ?? []
          const context = tag.details?.context_length ?? FALLBACK_CONTEXT
          models[id] = {
            id,
            providerID: PROVIDER_ID,
            name: displayName(id),
            family: "ollama",
            api: { id, url, npm: "@ai-sdk/openai-compatible" },
            status: "active",
            headers: {},
            options: {},
            // Local inference is free.
            cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
            limit: { context, output: Math.min(Math.max(Math.floor(context / 4), 1024), 32768) },
            capabilities: {
              temperature: true,
              reasoning: caps.includes("thinking"),
              attachment: caps.includes("vision"),
              toolcall: caps.includes("tools"),
              input: {
                text: true,
                audio: false,
                image: caps.includes("vision"),
                video: false,
                pdf: false,
              },
              output: { text: true, audio: false, image: false, video: false, pdf: false },
              interleaved: false,
            },
            release_date: "",
            variants: {},
          }
        }
        return models
      },
    },
  }
}
