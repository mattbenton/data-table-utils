import { test, expect } from 'vitest';
import { summarize } from './summarize';
import { sum } from 'd3-array';

test('single row', () => {
  const result = summarize({
    rows: [{ country: 'AU' }],
    operations: [{ select: (row) => row.country, alias: 'country' }]
  });
  expect(result).toEqual([{ country: 'AU' }]);
});

test('single row multi column', () => {
  const result = summarize({
    rows: [{ country: 'AU', population: 500 }],
    operations: [{ select: (row) => row.country, alias: 'country' }]
  });
  expect(result).toEqual([{ country: 'AU' }]);
});

test('single row with aggregate', () => {
  const result = summarize({
    rows: [{ country: 'AU', population: 500 }],
    operations: [
      { select: (row) => row.country, alias: 'country' },
      {
        select: (row) => row.population,
        alias: 'total_pop',
        aggregate: sum
      }
    ]
  });
  expect(result).toEqual([{ country: 'AU', total_pop: 500 }]);
});

test('select repeating dimension', () => {
  const result = summarize({
    rows: [
      { country: 'AU', population: 500 },
      { country: 'AU', population: 500 }
    ],
    operations: [{ select: (row) => row.country, alias: 'country' }]
  });
  expect(result).toEqual([{ country: 'AU' }]);
});

test('without primary key', () => {
  const result = summarize({
    rows: [
      { country: 'AU', population: 500 },
      { country: 'AU', population: 500 }
    ],
    operations: [
      { select: (row) => row.country, alias: 'country' },
      { select: (row) => row.population, alias: 'population', aggregate: sum }
    ]
  });
  expect(result).toEqual([{ country: 'AU', population: 1000 }]);
});

test('with primary key', () => {
  const result = summarize({
    rows: [
      { country: 'AU', population: 500 },
      { country: 'AU', population: 500 }
    ],
    operations: [
      { select: (row) => row.country, alias: 'country' },
      {
        select: (row) => row.population,
        alias: 'population',
        aggregate: sum,
        primaryKey: (row) => row.country
      }
    ]
  });
  expect(result).toEqual([{ country: 'AU', population: 500 }]);
});

test('multi dimension but only select country', () => {
  const result = summarize({
    rows: [
      { country: 'AU', state: 'VIC', population: 500 },
      { country: 'AU', state: 'QLD', population: 250 }
    ],
    operations: [
      { select: (row) => row.country, alias: 'country' },
      {
        select: (row) => row.population,
        alias: 'population',
        aggregate: sum,
        primaryKey: (row) => row.country
      }
    ]
  });
  expect(result).toEqual([{ country: 'AU', population: 500 }]);
});

test('group country and state', () => {
  const result = summarize({
    rows: [
      { country: 'AU', state: 'VIC', city: 'Melbourne', population: 500 },
      { country: 'AU', state: 'VIC', city: 'Carnegie', population: 100 },
      { country: 'AU', state: 'QLD', city: 'Sydney', population: 250 }
    ],
    operations: [
      { select: (row) => row.country, alias: 'country' },
      { select: (row) => row.state, alias: 'state' },
      {
        select: (row) => row.population,
        alias: 'population',
        aggregate: sum
      }
    ]
  });
  expect(result).toEqual([
    { country: 'AU', state: 'VIC', population: 600 },
    { country: 'AU', state: 'QLD', population: 250 }
  ]);
});
