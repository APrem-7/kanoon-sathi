import assert from 'node:assert/strict';
import { calculateDelhiDuty } from './stampDuty.js';

assert.deepEqual(calculateDelhiDuty(5_000_000, 5_500_000, 'woman'), {
  assessableValue: 5_500_000,
  rate: 0.04,
  stampDuty: 220_000,
  registrationFee: 55_100,
  total: 275_100,
});
assert.equal(calculateDelhiDuty(5_000_000, 0, 'joint').total, 350_100);
