import { test, expect } from 'vitest';
import { join, joinLeft } from './join';
import { prefixKeys } from './utils';

test('join', () => {
  const sessions = prefixKeys('sessions__', [{ id: 'S1' }, { id: 'S2' }]);
  const orders = prefixKeys('orders__', [
    { id: 'O1', sid: 'S1' },
    { id: 'O2', sid: 'S1' }
  ]);
  const result = join(
    sessions,
    orders,
    (s, o) => s.sessions__id === o.orders__sid
  );

  expect(result).toEqual([
    { sessions__id: 'S1', orders__id: 'O1', orders__sid: 'S1' },
    { sessions__id: 'S1', orders__id: 'O2', orders__sid: 'S1' }
  ]);
});

test('joinLeft', () => {
  const sessions = prefixKeys('sessions__', [{ id: 'S1' }, { id: 'S2' }]);
  const orders = prefixKeys('orders__', [
    { id: 'O1', sid: 'S1' },
    { id: 'O2', sid: 'S1' }
  ]);
  const result = joinLeft(
    sessions,
    orders,
    (s, o) => s.sessions__id === o.orders__sid
  );

  expect(result).toEqual([
    { sessions__id: 'S1', orders__id: 'O1', orders__sid: 'S1' },
    { sessions__id: 'S1', orders__id: 'O2', orders__sid: 'S1' },
    { sessions__id: 'S2', orders__id: undefined, orders__sid: undefined }
  ]);
});
