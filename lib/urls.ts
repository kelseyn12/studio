export function publicFileUrl(relative: string): string {
  return `/api/files/${relative.replace(/\\/g, "/")}`;
}

/** In-app Watch / Download / players. Never the R2 S3 API host — browsers get an empty XML error there. */
export function watchUrl(relative: string): string {
  return publicFileUrl(relative);
}
