/**
 * 빈 문자열·공백만 있는 값을 null로 통일합니다.
 * API 응답 및 DB 저장 시 phoneNumber 일관성을 위해 사용합니다.
 */
export function normalizePhoneNumber(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed === '' ? null : trimmed;
}
