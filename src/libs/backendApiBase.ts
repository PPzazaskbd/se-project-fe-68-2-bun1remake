const DEFAULT_BACKEND_ORIGIN = "https://se-project-be-68-2-bun1remake.vercel.app/";
const DEFAULT_BACKEND_API_PREFIX = "api/v1";
const DEFAULT_BACKEND_API_BASE = `${DEFAULT_BACKEND_ORIGIN}${DEFAULT_BACKEND_API_PREFIX}`;

function normalizeBackendApiBase(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_BACKEND_API_BASE;
  }

  try {
    const url = new URL(trimmedValue);

    url.pathname =
      url.pathname === "/" ? DEFAULT_BACKEND_API_PREFIX : url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmedValue.replace(/\/+$/, "");
  }
}

export const BACKEND_API_BASE = normalizeBackendApiBase(
  process.env.BACKEND_API_BASE ?? process.env.NEXT_PUBLIC_BACKEND_API_BASE,
);

export function buildBackendUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${BACKEND_API_BASE}${normalizedPath}`;
}
