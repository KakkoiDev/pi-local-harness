// Task 326: Pi's ollama provider goes through the workbench's tool-call repair proxy (harness/tool_repair_proxy.py),
// which turns tool calls a small model wrote as text into real ones. The person's ~/.pi files are never changed: the
// extension registers the provider for this Pi only. A web worker gets the proxy's address in its environment; terminal
// Pi learns it from the services' ready line once they start. Only a provider that points at the workbench's own Ollama
// (ollama_url) is routed; one pointing elsewhere is left alone. Each request carries the harness request id in a field
// the proxy removes before Ollama sees it, so a repair is logged under the request it belongs to.
const DEFAULT_OLLAMA = 'http://127.0.0.1:11434';
export const REQUEST_FIELD = '_pi_harness_request';

export function sameAddress(a, b) {
  const normal = url => { try { const parsed = new URL(url); const host = parsed.hostname === 'localhost' ? '127.0.0.1' : parsed.hostname; return `${parsed.protocol}//${host}:${parsed.port || (parsed.protocol === 'https:' ? 443 : 80)}${parsed.pathname.replace(/\/+$/, '')}`; } catch { return String(url); } };
  return normal(a) === normal(b);
}

export function installToolRepair(pi, { config = {}, localModels, request = () => undefined, bare = false } = {}) {
  let routed = false;
  const route = url => {
    if (bare || !url || routed === url) return Boolean(routed);
    const own = `${(process.env.PI_OLLAMA_URL || DEFAULT_OLLAMA).replace(/\/+$/, '')}/v1`;
    if (!sameAddress(localModels(config).baseUrl || `${DEFAULT_OLLAMA}/v1`, own)) return false;
    pi.registerProvider?.('ollama', localModels({ ...config, baseUrl: url }));
    routed = url;
    return true;
  };
  route(process.env.PI_HARNESS_TOOL_REPAIR_URL);
  pi.on?.('before_provider_request', (event, ctx) => {
    const id = request();
    if (!routed || !id || ctx?.model?.provider !== 'ollama' || !event?.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) return undefined;
    return { ...event.payload, [REQUEST_FIELD]: id };
  });
  return { route, routed: () => routed };
}
