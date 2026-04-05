export function fileSrc(path: string): string {
  return `/api/files/serve?path=${encodeURIComponent(path)}`;
}
