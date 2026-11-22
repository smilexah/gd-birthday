import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAccepting } from '../src/db.js'

const closesAt = new Date('2026-11-25T00:00:00+05:00')
const zones = ['UTC', 'Asia/Almaty', 'America/New_York', 'Asia/Tokyo', 'Pacific/Kiritimati']

for (const zone of zones) {
  test(`deadline boundary does not depend on server time zone ${zone}`, () => {
    process.env.TZ = zone
    const lastSecond = Date.parse('2026-11-24T23:59:59+05:00')
    const midnight = Date.parse('2026-11-25T00:00:00+05:00')
    assert.equal(closesAt.toISOString(), '2026-11-24T19:00:00.000Z')
    assert.equal(isAccepting(true, closesAt, lastSecond), true)
    assert.equal(isAccepting(true, closesAt, lastSecond + 999), true)
    assert.equal(isAccepting(true, closesAt, midnight), false)
    assert.equal(isAccepting(true, closesAt, midnight + 1), false)
  })
}

test('closed manually stays closed before the deadline', () => {
  assert.equal(isAccepting(false, closesAt, Date.parse('2026-11-23T12:00:00+05:00')), false)
})

test('no deadline means open while the switch is on', () => {
  assert.equal(isAccepting(true, null, Date.parse('2027-01-01T00:00:00+05:00')), true)
})
