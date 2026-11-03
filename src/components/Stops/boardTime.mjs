import { DateTime } from 'luxon'

export function boardTimeChoices(date, clock, timezone) {
  const value = DateTime.fromISO(`${date}T${clock}`, { zone: timezone })
  if (!value.isValid || value.toFormat('yyyy-MM-dd HH:mm') !== `${date} ${clock}`) return []
  return value.getPossibleOffsets().sort((a, b) => a.toMillis() - b.toMillis())
}
