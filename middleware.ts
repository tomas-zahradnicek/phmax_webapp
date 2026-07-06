import { LEGACY_VIEW_PATHS, resolveLegacyViewRedirect } from "./legacy-view-redirect.mjs";

export { LEGACY_VIEW_PATHS };

export const config = {
  matcher: ["/", "/prehled"],
};

export default function middleware(request: Request): Response | undefined {
  const location = resolveLegacyViewRedirect(request.url);
  if (!location) return;

  return new Response(null, {
    status: 308,
    headers: { Location: location },
  });
}
