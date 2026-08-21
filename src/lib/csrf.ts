/**
 * Minimal CSRF defense for Route Handlers.
 *
 * Next.js Server Actions get automatic same-origin verification built in.
 * Plain Route Handlers (what src/app/api/auth/* uses, chosen so login/logout
 * are genuinely testable over plain HTTP — see README) do NOT get that for
 * free, so we check it ourselves: reject any state-changing request whose
 * Origin header doesn't match this app's own origin. A cross-site page
 * cannot set that header to our origin, so this blocks the classic
 * "attacker's page silently submits a form to our API" attack.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  // Same-origin browser requests always send Origin for state-changing
  // methods. No Origin header at all (e.g. a non-browser script) is treated
  // as untrusted for these endpoints — better to reject a rare legitimate
  // caller than accept a forged one.
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  const originUrl = new URL(origin);

  return requestUrl.host === originUrl.host && requestUrl.protocol === originUrl.protocol;
}
