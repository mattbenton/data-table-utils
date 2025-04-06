import { rollup } from 'd3-array';
import { count, countDistinct, sum, mean } from './functions';
import { join, joinLeft, summarize, table } from './core-old';
import { compose } from './utils';
// import { applyPipe } from 'froebel';

// type JoinFn<
//   T1 extends Table,
//   T2 extends Table,
//   JoinRow = MergedRow<T1, T2>
// > = (row: JoinRow) => boolean

type JoinFn<Row1, Row2, JoinRow = Row1 & Row2> = (row: JoinRow) => boolean;

type MergedRow<T1 extends Table, T2 extends Table> = PrefixKeys<
  T1['rows'][number],
  T1['name']
> &
  PrefixKeys<T2['rows'][number], T2['name']>;

type Join = {
  type: 'join' | 'left';
  table: Table;
  joinFn: JoinFn<Row, Row>;
  // joinFn: JoinFn<Table, Table>
};

// type MergedRow<
//   Prefix1 extends string,
//   Row1 extends Row,
//   Prefix2 extends string,
//   Row2 extends Row
// > = PrefixKeys<Row1, Prefix1> & PrefixKeys<Row2, Prefix2>

type PrefixKeys<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

type PrefixedTableRow<T extends Table> = PrefixKeys<
  T['rows'][number],
  T['name']
>;

// type A = {key: string, country_code: string}
// type B = {code: string, name: string}

// type C = MergedRow<'sessions', A, 'countries', B>

type Row = Record<string, any>;

type Aggregate = 'count' | 'count_distinct' | 'sum';

type Select<TField> = {
  field: TField;
  alias?: string;
  aggregate?: Aggregate;
};

export class Query<
  TFromTable extends Table,
  TJoinRow = PrefixedTableRow<TFromTable>,
  TField = keyof TJoinRow
> {
  private fromTable: TFromTable;
  private joins: Join[] = [];
  private selects: Select<TField>[] = [];

  constructor(from: TFromTable) {
    this.fromTable = from;
  }

  join<
    TJoinTable extends Table,
    TMergedRow = TJoinRow & PrefixedTableRow<TJoinTable>,
    TResult = Query<TFromTable, TMergedRow>
  >(
    table: TJoinTable,
    joinFn: JoinFn<TJoinRow, PrefixedTableRow<TJoinTable>>
  ): TResult {
    this.joins.push({
      type: 'join',
      table,
      joinFn: joinFn as JoinFn<Row, Row>
    });
    return this as unknown as TResult;
  }

  leftJoin<
    TJoinTable extends Table,
    TMergedRow = TJoinRow & Partial<PrefixedTableRow<TJoinTable>>,
    TResult = Query<TFromTable, TMergedRow>
  >(
    table: TJoinTable,
    joinFn: JoinFn<TJoinRow, PrefixedTableRow<TJoinTable>>
  ): TResult {
    this.joins.push({
      type: 'left',
      table,
      joinFn: joinFn as JoinFn<Row, Row>
    });
    return this as unknown as TResult;
  }

  select(field: TField, opts?: { alias?: string; aggregate?: Aggregate }) {
    this.selects.push({
      field,
      ...opts
    });
    return this;
  }

  execute() {
    // Start with "from" table and rename all row keys from
    // {field1: value1} to {tabel.field1: value1}
    let results: Row[] = this.fromTable.rows.map((row) => {
      return qualifyRowKeys(row, this.fromTable.name);
    });
    let newResults: Row[] = [];
    for (const join of this.joins) {
      // console.log(`### joining "${join.table.name}"`);
      newResults = [];
      const unmatchedRows = new Set<Row>();
      for (const row of results) {
        for (const otherRow of join.table.rows) {
          const qualifiedOtherRow = qualifyRowKeys(otherRow, join.table.name);
          const mergedRow = {
            ...row,
            ...qualifiedOtherRow
          };
          const matched = join.joinFn(mergedRow);
          if (join.type === 'join') {
            if (matched) {
              // Only add normal joins if both sides match
              // console.log('matched', mergedRow);
              newResults.push(mergedRow);
            }
          } else if (join.type === 'left') {
            if (matched) {
              // console.log('matched', mergedRow);
              newResults.push(mergedRow);
            } else if (!unmatchedRows.has(row)) {
              unmatchedRows.add(row);
              const otherRowUndefined = Object.keys(qualifiedOtherRow).reduce(
                (row, key) => {
                  row[key] = undefined;
                  return row;
                },
                {} as Row
              );
              newResults.push({
                ...row,
                ...otherRowUndefined
              });
            }
          }
        }
      }
      // console.log('newResults', newResults)
      results = newResults;
    } // end of joins loop

    // for (const item of this.selects) {

    // }

    console.log('results', results);

    const grouped = rollup(
      results,
      (group) => ({
        'session count': count(group, (d) => d['sessions.key']),
        'unique session count': countDistinct(group, (d) => d['sessions.key']),
        'orders.count': count(group, (d) => d['orders.id']),
        'orders.net_sum': sum(group, (d) => d['orders.net']),
        'orders.net_avg': mean(group, (d) => d['orders.net'])
      }),
      (d) => d['countries.name'],
      (d) => d['sessions.state']
    );
    console.log('grouped', grouped);

    // Convert the Map to an array of objects
    // const result = Array.from(grouped, ([country, values]) => ({
    //   country,
    //   ...values
    // }));

    const result = Array.from(grouped, ([country, states]) => {
      return {
        country,
        states: Array.from(states, ([city, values]) => ({
          city,
          ...values
        }))
      };
    });
    console.log('result', JSON.stringify(result, null, 2));

    return results;
  }
}

// function qualifyRows(rows: Row[], tableName: string) {
//   return rows.map(row => qualifyRowKeys(row, tableName))
// }

function qualifyRowKeys(row: Row, tableName: string) {
  const result: Row = {};
  for (const [key, value] of Object.entries(row)) {
    const newKey = key.includes('.') ? key : `${tableName}.${key}`;
    result[newKey] = value;
  }
  return result;
}

export class Table<TName extends string = string, TRow extends Row = Row> {
  name: TName;
  rows: TRow[] = [];

  constructor(name: TName, rows: TRow[] = []) {
    this.name = name;
    this.rows = rows;
  }
}

function prefixKeys<
  TPrefix extends string,
  TRow extends Row,
  TResultRow = PrefixKeys<TRow, TPrefix>
>(prefix: TPrefix, rows: TRow[]): TResultRow[] {
  return rows.map((row) => {
    return Object.keys(row).reduce((outRow, key) => {
      outRow[prefix + key] = row[key];
      return outRow;
    }, {} as Row);
  }) as TResultRow[];
}

function namespaceRows<
  TNamespace extends string,
  TRow extends Row,
  TResultRow = Record<TNamespace, TRow>
>(namespace: TNamespace, rows: TRow[]): TResultRow[] {
  return rows.map((row) => {
    return { [namespace]: row } as TResultRow;
  });
}

// const sessions = table({
//   rows: prefixKeys('sessions_', [
//     { id: 'S1', country_code: 'AU', page_views: 5, device: 'Mobile' },
//     { id: 'S2', country_code: 'AU', page_views: 8, device: 'Computer' },
//     { id: 'S3', country_code: 'CH', page_views: 15, device: 'Computer' }
//   ])
// });

const sessions = prefixKeys('session_', [
  { id: 'S1', country_code: 'AU', page_views: 5, device: 'Mobile' },
  { id: 'S2', country_code: 'AU', page_views: 8, device: 'Computer' },
  { id: 'S3', country_code: 'CH', page_views: 15, device: 'Computer' }
]);
const orders = prefixKeys('order_', [
  { id: 'O1', session_id: 'S1', net: 500 },
  { id: 'O2', session_id: 'S1', net: 250 }
]);
const countries = prefixKeys('country_', [
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'JP', name: 'Japan' },
  { code: 'US', name: 'United States' }
]);

const joins2 = compose(sessions)
  .pipe((from) =>
    joinLeft(
      from,
      orders,
      (left, right) => left.session_id === right.order_session_id
    )
  )
  .pipe((from) =>
    join(
      from,
      countries,
      (left, right) => left.session_country_code === right.country_code
    )
  )
  .build();

// console.log('joins', joins2);

// summarize({
//   rows: joins2,
//   operations: [
//     { select: 'country_name' },
//     { select: 'order_net', aggregate: 'sum' }
//   ],
//   getFieldPrimaryKey(field) {
//     if (field.startsWith('sessions_')) {
//       return 'session_id';
//     }
//   }
// });
