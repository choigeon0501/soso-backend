export function getLastSegment(url: string) {
  if (typeof url !== 'string') return null;
  const segments = url.trim().split('/');
  return segments.pop() || null;
}