export function publicFileUrl(relative: string): string {
  return `/api/files/${relative.replace(/\\/g, "/")}`;
}
