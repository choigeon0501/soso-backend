export function convertTimeToAmPm(timeStr: string) {
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour < 12 ? '오전' : '오후';
  return `${period} ${hourStr.padStart(2, '0')}:${minuteStr}`;
}
