/**
 * ZealLab Agent offline policy.
 *
 * Owned by the ZealLab fork — upstream opencode has no counterpart, so this
 * file never conflicts on a merge.
 *
 * `packages/opencode/src/brand/bootstrap.ts` sets these same defaults by
 * mutating `process.env` from the first import of the CLI entrypoint. That
 * works when modules are evaluated in source order, but `Flag` in
 * `flag/flag.ts` is a plain object literal whose values are computed the
 * moment that module is first evaluated — and after bundling into the single
 * release binary, `flag.ts` is evaluated *before* the bootstrap side effect.
 * The flags then read as false and the agent fetches models.dev and loads the
 * cloud catalog, exactly what the fork exists to prevent.
 *
 * Deciding the default here instead makes it independent of module order: the
 * value is computed inside flag.ts's own evaluation, straight from the
 * environment.
 */

function truthyEnv(value: string | undefined) {
  if (value === undefined) return undefined
  const lowered = value.toLowerCase()
  return lowered === "true" || lowered === "1"
}

/**
 * Whether the fork's local-only posture applies. An operator opts out with
 * `ZEALLAB_ALLOW_NETWORK=1`.
 */
export function offline() {
  return truthyEnv(process.env["ZEALLAB_ALLOW_NETWORK"]) !== true
}

/**
 * Default for an `OPENCODE_DISABLE_*` flag: an explicit setting always wins,
 * otherwise it follows the offline posture.
 */
export function disabledByDefault(key: string) {
  return truthyEnv(process.env[key]) ?? offline()
}
