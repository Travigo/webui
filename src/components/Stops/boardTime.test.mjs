import test from 'node:test'
import assert from 'node:assert/strict'
import { boardTimeChoices } from './boardTime.mjs'

test('board times use the stop timezone and reject clock-change gaps', () => {
  assert.equal(boardTimeChoices('2026-03-29', '01:30', 'Europe/London').length, 0)
  assert.equal(boardTimeChoices('2026-07-02', '00:30', 'Europe/London')[0].toISO(), '2026-07-02T00:30:00.000+01:00')
})

test('ambiguous times expose both occurrences in chronological order', () => {
  const choices = boardTimeChoices('2026-10-25', '01:30', 'Europe/London')
  assert.equal(choices.length, 2)
  assert.deepEqual(choices.map(choice => choice.offset), [60, 0])
  assert.ok(choices[0].toMillis() < choices[1].toMillis())
})
