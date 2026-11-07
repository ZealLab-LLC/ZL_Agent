// The CLI uses this default for source runs. Compiled ZealLab builds also set
// the define so the policy survives server subprocesses and bundling.
declare const ZEALLAB_OFFLINE: boolean | undefined

function truthy(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true"
}

export function offline() {
  if (process.env.ZEALLAB_ALLOW_NETWORK !== undefined) return !truthy(process.env.ZEALLAB_ALLOW_NETWORK)
  return (typeof ZEALLAB_OFFLINE !== "undefined" && ZEALLAB_OFFLINE) || truthy(process.env.ZEALLAB_LOCAL_CLI)
}

export function disabledByDefault(key: string) {
  const value = process.env[key]
  return value === undefined ? offline() : truthy(value)
}

export function localProvidersOnly() {
  return !truthy(process.env.ZEALLAB_ALLOW_REMOTE_PROVIDERS)
}
