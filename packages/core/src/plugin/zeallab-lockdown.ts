import { Effect } from "effect"
import { define } from "./internal"
import { PROVIDER_ID as OLLAMA_PROVIDER_ID } from "./provider/ollama"

/**
 * ZealLab Agent local-only lockdown.
 *
 * Owned by the ZealLab fork — upstream opencode has no counterpart, so this
 * file never conflicts on a merge. Upstream's ~32 provider plugins stay on disk
 * untouched; this plugin simply drops everything they registered, so the only
 * reachable model provider is the local Ollama daemon.
 *
 * Registered LAST in plugin/internal.ts. State transforms run in registration
 * order (see State.create in state.ts), so these removals are applied after
 * models-dev, every provider plugin, and the user's own config providers.
 *
 * Set ZEALLAB_ALLOW_REMOTE_PROVIDERS=1 to bypass the lockdown for debugging.
 */

function bypassed() {
  const value = process.env["ZEALLAB_ALLOW_REMOTE_PROVIDERS"]
  return value === "1" || value === "true"
}

export const ZealLabLockdownPlugin = define({
  id: "zeallab-lockdown",
  effect: Effect.fn(function* (ctx) {
    if (bypassed()) return

    yield* ctx.catalog.transform((catalog) => {
      for (const record of catalog.provider.list()) {
        if (record.provider.id === OLLAMA_PROVIDER_ID) continue
        catalog.provider.remove(record.provider.id)
      }
      // If the default model still points at a removed provider, clear it by
      // pointing at the first local model we have.
      const current = catalog.model.default.get()
      if (current && current.providerID !== OLLAMA_PROVIDER_ID) {
        const ollama = catalog.provider.get(OLLAMA_PROVIDER_ID)
        const first = ollama ? [...ollama.models.keys()][0] : undefined
        if (first) catalog.model.default.set(OLLAMA_PROVIDER_ID, first)
      }
    })

    // Drop every remote sign-in (Anthropic, OpenAI, GitHub Copilot, ...) so the
    // UI never offers to authenticate against a cloud service.
    yield* ctx.integration.transform((integrations) => {
      for (const integration of integrations.list()) {
        if (integration.id === OLLAMA_PROVIDER_ID) continue
        integrations.remove(integration.id)
      }
    })
  }),
})
