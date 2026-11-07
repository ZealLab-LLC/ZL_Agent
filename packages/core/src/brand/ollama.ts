export const PROVIDER_ID = "ollama"

/** Default port the Ollama daemon listens on. */
const DEFAULT_PORT = "11434"

/**
 * Base URL of the local Ollama daemon.
 *
 * `OLLAMA_HOST` is the daemon's *bind* address, and the values people set are
 * not always usable as a client destination:
 *
 *   - `OLLAMA_HOST=0.0.0.0` (the usual way to expose Ollama on the LAN) has no
 *     port, so a naive `http://` + value resolves to port 80 and every request
 *     fails. That leaves the catalog empty and the app looks broken even
 *     though the daemon is running fine.
 *   - `0.0.0.0` / `::` mean "all interfaces" and are not a real destination on
 *     every platform, so dial the loopback address instead.
 *
 * Both are normalised here so the daemon is reached whichever form is set.
 */
export function baseUrl() {
  const raw = (process.env["ZEALLAB_OLLAMA_URL"] || process.env["OLLAMA_HOST"] || "localhost").trim()
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return `http://127.0.0.1:${DEFAULT_PORT}`
  }
  if (url.hostname === "0.0.0.0" || url.hostname === "[::]" || url.hostname === "") url.hostname = "127.0.0.1"
  if (!url.port) url.port = DEFAULT_PORT
  return url.origin + url.pathname.replace(/\/+$/, "").replace(/\/(?:api|v1)$/, "")
}
