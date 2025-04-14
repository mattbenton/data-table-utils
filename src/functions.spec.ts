import { describe, test, expect } from 'vitest';
import { count, countDistinct } from './functions';

describe('count', () => {
  test('numbers', () => {
    expect(count([1, 1, 1, 2, 3])).toEqual(5);
  });

  test('mixed', () => {
    expect(count([1, true, false, null, '3', '', NaN])).toEqual(5);
  });
});

describe('countDistinct', () => {
  test('numbers', () => {
    expect(countDistinct([1, 1, 1, 2, 3])).toEqual(3);
  });

  test('mixed', () => {
    expect(countDistinct([1, true, false, null, '3', '', NaN])).toEqual(5);
  });
});
