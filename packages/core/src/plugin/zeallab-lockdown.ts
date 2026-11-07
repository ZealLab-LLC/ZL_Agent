import { define } from "@opencode/plugin/effect/plugin"
import { Effect } from "effect"
import { PROVIDER_ID } from "../brand/ollama.js"
import { localProvidersOnly } from "../zeallab-offline.js"

// Run after external and configured plugins so they cannot reintroduce providers.
export const ZealLabLockdownPlugin = define({
  id: "zeallab-lockdown",
  effect: Effect.fn(function* (ctx) {
    if (!localProvidersOnly()) return
    yield* ctx.provider.transform((providers) => {
      for (const { provider } of providers.list()) {
        if (provider.id !== PROVIDER_ID) providers.remove(provider.id)
      }
    })
    yield* ctx.model.transform((models) => {
      if (models.default.get()?.providerID === PROVIDER_ID) return
      const candidates = models.list(PROVIDER_ID).filter((model) => model.enabled)
      const preferred = candidates.find((model) => model.capabilities.tools) ?? candidates[0]
      if (preferred) models.default.set(PROVIDER_ID, preferred.id)
    })
    yield* ctx.integration.transform((integrations) => {
      for (const integration of integrations.list()) {
        if (integration.id !== PROVIDER_ID) integrations.remove(integration.id)
      }
    })
  }),
})
