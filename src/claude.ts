import type { Row } from './types';

// type Operation<TAlias extends string> = { alias: TAlias };

type Operation<TRow extends Row, TAlias extends string, TResult> = {
  alias: TAlias;
  select: (row: TRow) => TResult;
  primaryKey?: (row: TRow) => any;
  aggregate?: (values: TResult[]) => any;
};

// interface OperationOptions<TRow extends Row, TAlias extends string> {
//   alias: TAlias
//   select: (row: TRow) => any
// }

// const ops: Operation[] = [
//   {alias: 'name'},
//   {alias: 'age'}
// ] as const;

// type ExtractedAliases = typeof ops[number]['alias'];
// // Result: 'name' | 'age'

function summarize<TOperations extends Operation<any, string, any>[]>(
  operations: TOperations
) {
  return [] as Record<TOperations[number]['alias'], any>[];
}

function operation<TRow extends Row, TAlias extends string, TResult>(opts: {
  alias: TAlias;
  select: (row: TRow) => TResult;
  primaryKey?: (row: TRow) => any;
}): Operation<TRow, TAlias, TResult> {
  return opts;
}

const op = operation({
  alias: 'fred',
  select: () => 2,
  primaryKey: () => 'hello'
});

// summarize([op])[0].fred;

// summarize([{alias: 'name'}])[0]

// function summarize<
//   TRow extends Row,
//   TOperation extends { alias: string }[],
//   TAliases extends TOperation[number]['alias']
// >(
//   row: TRow,
//   operations: TOperation
//   // aliases: TAlias[]
// ): Record<TAliases, any>[] {
//   return [];
// }

// const people = [
//   { name: 'Alice', age: 30, salary: 60000 },
//   { name: 'Bob', age: 25, salary: 50000 },
//   { name: 'Charlie', age: 35, salary: 70000 }
// ];

// // summarize(people, ['bob', 'fred'])[0].
// summarize(people, [{ alias: 'hello' }])[0];

// // Define the Operation interface with better typing
// interface Operation<TRow extends Row, TAlias extends string, TResult = any> {
//   alias: TAlias;
//   select: (row: TRow) => TResult;
// }

// // Define a type that maps operation aliases to their result types
// type SummarizeResult<TOps extends readonly Operation<any, string, any>[]> = {
//   // [Op in TOps[number] as Op['alias']]: ReturnType<Op['select']>
//   [Op in TOps[0]['alias']]: 'wolrd'
// }

// // Implement the summarize function with proper typing
// function summarize<
//   TRow extends Row,
//   TOps extends readonly Operation<TRow, string, any>[]
// >(rows: TRow[], operations: TOps): SummarizeResult<TOps>[] {
//   return rows.map(row => {
//     const result = {} as SummarizeResult<TOps>;

//     operations.forEach(operation => {
//       (result as any)[operation.alias] = operation.select(row);
//     });

//     return result;
//   });
// }
// // type S = SummarizeResult<Person, [Operation<Person, 'matt', string>, Operation<Person, 'age'>]>

// interface Person {
//   name: string;
//   age: number;
//   salary: number;
// }

// const people: Person[] = [
//   { name: "Alice", age: 30, salary: 60000 },
//   { name: "Bob", age: 25, salary: 50000 },
//   { name: "Charlie", age: 35, salary: 70000 }
// ];

// const result = summarize(people, [
//   {alias: 'name', select: row => row.age}
// ])
// result[0].

// // const operations: Operation<Person>[] = [
// //   {
// //     alias: "fullName",
// //     select: (person) => person.name
// //   },
// //   {
// //     alias: "ageGroup",
// //     select: (person) => person.age < 30 ? "Young" : "Senior"
// //   },
// //   {
// //     alias: "salaryAfterTax",
// //     select: (person) => person.salary * 0.8
// //   }
// // ];

// // const result = summarize(people, operations);
// // result[0]
// // console.log(result);

// // import { rollup, sum, mean } from 'd3-array';

// // export interface Operation {
// //   select: string;
// //   aggregate?: 'sum' | 'avg' | 'count';
// //   alias?: string;
// // }

// // interface DataRow {
// //   [key: string]: any;
// // }

// // export function dynamicAggregate(data: DataRow[], operations: Operation[]) {
// //   // Separate group-by fields from aggregation fields
// //   const groupByFields = operations
// //     .filter((op) => !op.aggregate)
// //     .map((op) => op.select);

// //   const aggregateOps = operations.filter((op) => op.aggregate);

// //   // Create accessor functions for group-by fields
// //   const accessors = groupByFields.map((field) => (d: DataRow) => d[field]);

// //   // Create the reducer function that handles all aggregations
// //   const reducer = (group: DataRow[]) => {
// //     const result: Record<string, any> = {};

// //     // Add group-by fields to the result
// //     groupByFields.forEach((field) => {
// //       // All records in a group will have the same value for group-by fields,
// //       // so we can just take the first one
// //       result[field] = group[0][field];
// //     });

// //     // Apply all aggregation operations
// //     aggregateOps.forEach((op) => {
// //       const outputField = op.alias || op.select;

// //       if (op.aggregate === 'sum') {
// //         result[outputField] = sum(group, (d) => d[op.select] || 0);
// //       } else if (op.aggregate === 'avg') {
// //         // For average, we need to handle fields that might be present multiple times
// //         // for the same logical entity (like sessions.page_views appearing multiple times for one session)
// //         if (op.select.startsWith('sessions.')) {
// //           // For session fields, use unique session keys to avoid duplicate counting
// //           const uniqueSessions = Array.from(
// //             new Set(group.map((d) => d['sessions.key']))
// //           );

// //           // For each unique session, find its value
// //           const values = uniqueSessions.map((sessionKey) => {
// //             const sessionData = group.find(
// //               (d) => d['sessions.key'] === sessionKey
// //             );
// //             return sessionData ? sessionData[op.select] || 0 : 0;
// //           });

// //           // Calculate average
// //           result[outputField] =
// //             values.length > 0
// //               ? values.reduce((a, b) => a + b, 0) / values.length
// //               : 0;
// //         } else {
// //           // For other fields, use d3's mean function
// //           result[outputField] = mean(group, (d) => d[op.select] || 0);
// //         }
// //       } else if (op.aggregate === 'count') {
// //         result[outputField] = group.length;
// //       }
// //     });

// //     return result;
// //   };

// //   // Apply the rollup function with our dynamic accessors and reducer
// //   const grouped = rollup(data, reducer, ...accessors);

// //   return flattenMap(grouped);
// // }

// // // Convert the potentially nested Map structure into an array of objects
// // function flattenMap(
// //   map: Map<string, any> | Record<string, any>,
// //   path: any[] = []
// // ): any[] {
// //   const result: any[] = [];

// //   map.forEach((value: Map<string, any> | Record<string, any>, key: string) => {
// //     const currentPath = [...path, key];

// //     if (value instanceof Map) {
// //       // If the value is a Map, recurse deeper
// //       result.push(...flattenMap(value, currentPath));
// //     } else {
// //       // If the value is the aggregation result object, add it to results
// //       result.push(value);
// //     }
// //   });

// //   return result;
// // }

// // // Example usage:
// // export const exampleData = [
// //   {
// //     'sessions.key': 'S1',
// //     'sessions.country_code': 'AU',
// //     'sessions.state': 'VIC',
// //     'sessions.page_views': 15,
// //     'countries.code': 'AU',
// //     'countries.name': 'Australia',
// //     'orders.id': 'O1',
// //     'orders.session_key': 'S1',
// //     'orders.net': 500
// //   },
// //   {
// //     'sessions.key': 'S1',
// //     'sessions.country_code': 'AU',
// //     'sessions.state': 'VIC',
// //     'sessions.page_views': 15,
// //     'countries.code': 'AU',
// //     'countries.name': 'Australia',
// //     'orders.id': 'O2',
// //     'orders.session_key': 'S1',
// //     'orders.net': 250
// //   },
// //   {
// //     'sessions.key': 'S1',
// //     'sessions.country_code': 'AU',
// //     'sessions.state': 'VIC',
// //     'sessions.page_views': 15,
// //     'countries.code': 'AU',
// //     'countries.name': 'Australia',
// //     'orders.id': undefined,
// //     'orders.session_key': undefined,
// //     'orders.net': undefined
// //   },
// //   {
// //     'sessions.key': 'S2',
// //     'sessions.country_code': 'AU',
// //     'sessions.state': 'VIC',
// //     'sessions.page_views': 10,
// //     'countries.code': 'AU',
// //     'countries.name': 'Australia',
// //     'orders.id': undefined,
// //     'orders.session_key': undefined,
// //     'orders.net': undefined
// //   },
// //   {
// //     'sessions.key': 'S3',
// //     'sessions.country_code': 'AU',
// //     'sessions.state': 'QLD',
// //     'sessions.page_views': 5,
// //     'countries.code': 'AU',
// //     'countries.name': 'Australia',
// //     'orders.id': undefined,
// //     'orders.session_key': undefined,
// //     'orders.net': undefined
// //   },
// //   {
// //     'sessions.key': 'S4',
// //     'sessions.country_code': 'US',
// //     'sessions.state': 'CA',
// //     'sessions.page_views': 10,
// //     'countries.code': 'US',
// //     'countries.name': 'United States',
// //     'orders.id': undefined,
// //     'orders.session_key': undefined,
// //     'orders.net': undefined
// //   },
// //   {
// //     'sessions.key': 'S4',
// //     'sessions.country_code': 'US',
// //     'sessions.state': 'CA',
// //     'sessions.page_views': 10,
// //     'countries.code': 'US',
// //     'countries.name': 'United States',
// //     'orders.id': 'O3',
// //     'orders.session_key': 'S4',
// //     'orders.net': 50
// //   }
// // ];

// // // // Operations example 1: Group by country_code
// // // const operations1: Operation[] = [
// // //   { select: 'sessions.country_code' },
// // //   { select: 'orders.net', aggregate: 'sum', alias: 'total_order_net' },
// // //   { select: 'sessions.page_views', aggregate: 'avg', alias: 'avg_page_views' }
// // // ];

// // // // Operations example 2: Group by country_code and state
// // // const operations2: Operation[] = [
// // //   { select: 'sessions.country_code' },
// // //   { select: 'sessions.state' },
// // //   { select: 'orders.net', aggregate: 'sum', alias: 'total_order_net' },
// // //   { select: 'sessions.page_views', aggregate: 'avg', alias: 'avg_page_views' }
// // // ];

// // // console.log('Example 1 - Grouped by country_code:');
// // // console.log(dynamicAggregate(input, operations1));

// // // console.log('\nExample 2 - Grouped by country_code and state:');
// // // console.log(dynamicAggregate(input, operations2));
