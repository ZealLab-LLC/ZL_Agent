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
 * Compiled into the release binary by packages/opencode/script/build.ts.
 * Absent when running from source and under `bun test`, which is deliberate:
 * the ordering bug this module exists to fix only affects the bundled binary,
 * and upstream's own ModelsDev tests must keep exercising the fetch and
 * disk-cache paths they were written for.
 */
declare const ZEALLAB_OFFLINE: boolean | undefined

/**
 * Whether the fork's local-only posture applies. An operator opts out with
 * `ZEALLAB_ALLOW_NETWORK=1`; in the unbundled path brand/bootstrap.ts has
 * already set the OPENCODE_DISABLE_* vars, so this only has to answer for the
 * release binary.
 */
export function offline() {
  const allow = truthyEnv(process.env["ZEALLAB_ALLOW_NETWORK"])
  if (allow !== undefined) return !allow
  return typeof ZEALLAB_OFFLINE === "undefined" ? false : ZEALLAB_OFFLINE
}

/**
 * Default for an `OPENCODE_DISABLE_*` flag: an explicit setting always wins,
 * otherwise it follows the offline posture.
 */
export function disabledByDefault(key: string) {
  return truthyEnv(process.env[key]) ?? offline()
}
