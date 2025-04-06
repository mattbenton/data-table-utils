// import { Query, Table } from './index';
import { test } from 'vitest';
// import { dynamicAggregate, exampleData, type Operation } from './claude';
import { compose, prefixKeys } from './utils';
import { join, joinLeft } from './join';
import { summarize } from './summarize';
import { mean, sum } from 'd3-array';
import { count } from './functions';

test('Matt', () => {
  const countries = prefixKeys('countries__', [
    { code: 'AU', name: 'Australia' },
    { code: 'US', name: 'United States' }
  ]);
  const sessions = prefixKeys('sessions__', [
    { key: 'S1', country_code: 'AU', state: 'VIC', page_views: 15 },
    { key: 'S2', country_code: 'AU', state: 'VIC', page_views: 10 },
    { key: 'S3', country_code: 'AU', state: 'QLD', page_views: 5 },
    { key: 'S4', country_code: 'US', state: 'CA', page_views: 10 }
  ]);
  const orders = prefixKeys('orders__', [
    { id: 'O1', session_key: 'S1', net: 500 },
    { id: 'O2', session_key: 'S1', net: 250 },
    { id: 'O3', session_key: 'S4', net: 50 }
  ]);

  const joined = compose(sessions)
    .pipe((from) =>
      join(
        from,
        countries,
        (left, right) => left.sessions__country_code === right.countries__code
      )
    )
    .pipe((from) =>
      joinLeft(
        from,
        orders,
        (left, right) => left.sessions__key === right.orders__session_key
      )
    )
    .build();

  console.log('joined', joined);

  const filtered = joined.filter((row) => (row.orders__net ?? 0) > 300);
  console.log('filtered', filtered);

  const result = summarize({
    rows: filtered,
    operations: [
      {
        select: (row) => `${row.countries__name} (${row.countries__code})`,
        alias: 'country_name'
      },
      {
        select: (row) => row.orders__id,
        alias: 'order_count',
        aggregate: count
      },
      {
        select: (row) => row.orders__net,
        alias: 'total_order_net',
        aggregate: sum
      },
      {
        select: (row) => row.sessions__page_views,
        alias: 'total_page_views',
        aggregate: sum,
        primaryKey: (row) => row.sessions__key
      },
      {
        select: (row) => row.sessions__page_views,
        alias: 'avg_page_views',
        aggregate: mean,
        primaryKey: (row) => row.sessions__key
      }
    ]
  });
  result[0];
  console.log('result', result);
});

// test.skip('Claude', () => {
//   // Operations example 1: Group by country_code
//   const operations1: Operation[] = [
//     { select: 'sessions.country_code' },
//     { select: 'orders.net', aggregate: 'sum', alias: 'total_order_net' },
//     { select: 'sessions.page_views', aggregate: 'avg', alias: 'avg_page_views' }
//   ];

//   // Operations example 2: Group by country_code and state
//   const operations2: Operation[] = [
//     { select: 'sessions.country_code' },
//     { select: 'sessions.state' },
//     { select: 'orders.net', aggregate: 'sum', alias: 'total_order_net' },
//     { select: 'sessions.page_views', aggregate: 'avg', alias: 'avg_page_views' }
//   ];

//   console.log('Example 1 - Grouped by country_code:');
//   console.log(dynamicAggregate(exampleData, operations1));

//   console.log('\nExample 2 - Grouped by country_code and state:');
//   console.log(dynamicAggregate(exampleData, operations2));
// });

// test.skip('Hello', () => {
//   const countries = new Table('countries', [
//     { code: 'AU', name: 'Australia' },
//     { code: 'US', name: 'United States' }
//   ]);
//   const sessions = new Table('sessions', [
//     { key: 'S1', country_code: 'AU', state: 'VIC', page_views: 15 },
//     { key: 'S2', country_code: 'AU', state: 'VIC', page_views: 10 },
//     { key: 'S3', country_code: 'AU', state: 'QLD', page_views: 5 },
//     { key: 'S4', country_code: 'US', state: 'CA', page_views: 10 }
//   ]);
//   const orders = new Table('orders', [
//     { id: 'O1', session_key: 'S1', net: 500 },
//     { id: 'O2', session_key: 'S1', net: 250 },
//     { id: 'O3', session_key: 'S4', net: 50 }
//   ]);
//   const query = new Query(sessions)
//     .join(countries, (row) => {
//       return row['sessions.country_code'] === row['countries.code'];
//     })
//     .leftJoin(orders, (row) => {
//       return row['sessions.key'] === row['orders.session_key'];
//     })
//     .select('sessions.key')
//     .select('orders.net', { aggregate: 'sum' });
//   // console.log('query', query)
//   query.execute();
// });

/*
  // sessions
  [
    {'sessions.key': 'S1', 'sessions.country_code': 'AU'},
    {'sessions.key': 'S2', 'sessions.country_code': 'AU'},
    {'sessions.key': 'S3', 'sessions.country_code': 'US'}
  ]

  // countries
  [
    {'countries.code': 'AU', 'countries.name': 'Australia'},
    {'countries.code': 'US', 'countries.name': 'United States'}
  ]

  // orders
  [
    {'orders.id': 'O1', 'orders.session_key': 'S1', 'orders.net': 500},
    {'orders.id': 'O2', 'orders.session_key': 'S1', 'orders.net': 250}
  ]

  // query
  select
    sessions.key as session_key
    countries.name as country_name,
    sum(orders.net) as total_order_net
  from sessions
  join countries on countries.code = sessions.country_code
  join orders on orders.session_key = sessions.key
  group by
    session_key,
    country_name

  {'sessions.key': 'S1', 'sessions.country_code': 'AU'},
  {'countries.code': 'AU', 'countries.name': 'Australia'}
    => {'sessions.key': 'S1', 'sessions.country_code': 'AU', 'countries.code': 'AU', 'countries.name': 'Australia'},
    => {'sessions.key': 'S2', 'sessions.country_code': 'AU', 'countries.code': 'AU', 'countries.name': 'Australia'},
    => {'sessions.key': 'S3', 'sessions.country_code': 'US', 'countries.code': 'US', 'countries.name': 'United States'}

  {
    'sessions.key': 'S1',
    'sessions.country_code': 'AU',
    'countries.code': 'AU',
    'countries.name': 'Australia',
    'orders.id': 'O1',
    'orders.session_key': 'S1',
    'orders.net': 500
  }
  {
    'sessions.key': 'S1',
    'sessions.country_code': 'AU',
    'countries.code': 'AU',
    'countries.name': 'Australia',
    'orders.id': 'O2',
    'orders.session_key': 'S1',
    'orders.net': 250
  }
  {
    'sessions.key': 'S2',
    'sessions.country_code': 'AU',
    'countries.code': 'AU',
    'countries.name': 'Australia'
  }
  {
    'sessions.key': 'S3',
    'sessions.country_code': 'US',
    'countries.code': 'US',
    'countries.name': 'United States'
  }
*/
