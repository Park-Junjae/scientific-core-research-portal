export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(pathname: string) {
  if (!pathname.startsWith("/")) return pathname;
  return `${basePath}${pathname}`;
}
