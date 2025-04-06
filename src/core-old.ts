import { mean, rollup, sum } from 'd3-array';
import type { Row } from './types';

export interface TableOptions<TRow> {
  rows: TRow[];
  primaryKey?: (row: TRow) => string;
}

export interface Table<T> extends Array<T> {
  primaryKey?: (row: T) => string;
}

export function table<TRow>(options?: TableOptions<TRow>): Table<TRow> {
  const rows = (options?.rows ?? []) as Table<TRow>;
  if (options?.primaryKey) {
    rows.primaryKey = () => 'ssdf';
  }
  return rows;
}

export function join<
  LeftRow extends Row,
  RightRow extends Row,
  ResultRow = LeftRow & RightRow
>(
  left: LeftRow[],
  right: RightRow[],
  compare: (left: LeftRow, right: RightRow) => boolean
): ResultRow[] {
  const result: ResultRow[] = [];
  for (const leftRow of left) {
    for (const rightRow of right) {
      if (compare(leftRow, rightRow)) {
        result.push({ ...leftRow, ...rightRow } as ResultRow);
      }
    }
  }
  return result;
}

export function joinLeft<
  LeftRow extends Row,
  RightRow extends Row,
  ResultRow = LeftRow & Partial<RightRow>
>(
  left: LeftRow[],
  right: RightRow[],
  compare: (left: LeftRow, right: RightRow) => boolean
): ResultRow[] {
  const result: ResultRow[] = [];
  // const processedLeftRows = new Set<LeftRow>();
  for (const leftRow of left) {
    let didJoin = false;
    for (const rightRow of right) {
      if (compare(leftRow, rightRow)) {
        didJoin = true;
        // processedLeftRows.add(leftRow);
        result.push({ ...leftRow, ...rightRow } as ResultRow);
      }
      //  else if (!processedLeftRows.has(leftRow)) {
      //   // processedLeftRows.add(leftRow);
      //   result.push({ ...leftRow } as unknown as ResultRow);
      // }
    }
    if (!didJoin) {
      result.push({ ...leftRow } as unknown as ResultRow);
    }
  }
  return result;
}

export interface Operation<TRow extends Row, TValue = any> {
  select: (row: TRow) => TValue;
  // aggregate?: 'sum' | 'avg' | 'count';
  aggregate?: (values: TValue[]) => any;
  primaryKey?: (row: TRow) => any;
  alias: string;
}

export function summarize<
  TRow extends Row,
  TOperations extends readonly Operation<TRow>[]
>(opts: { rows: TRow[]; operations: TOperations }) {
  const reducer = (group: TRow[]) => {
    // const result: Row = {};
    const result: Row = {};

    for (const op of opts.operations) {
      let values: any[] = [];
      // If the operation specifies a primary key field, use this to find a
      // unique set of rows to summarize this operation. This is essential when
      // there may be duplicate fields for the same logical entity (e.g. joining
      // tables).
      const primaryKey = op.primaryKey;
      if (primaryKey) {
        // A set of unique keys that we have seen so far
        const uniqueKeys = new Set();
        // Loop through each row and calculate its primary key for this
        // operation. If we haven't see the key before, add the value to our
        // collection for aggregating further down.
        for (const row of group) {
          const key = primaryKey(row);
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            values.push(op.select(row));
          }
        }
      } else {
        // Use values from all rows
        values = group.map((row) => op.select(row));
      }
      if (op.aggregate) {
        result[op.alias] = op.aggregate(values);
        // if (op.aggregate === 'sum') {
        //   result[op.alias] = sum(values, (value) => value ?? 0);
        // } else if (op.aggregate === 'avg') {
        //   result[op.alias] = mean(values, (value) => value ?? 0);
        // }
      } else {
        // Group by.
        // All records in a group will have the same value for group-by fields,
        // so we can just take the first one.
        result[op.alias] = op.select(group[0]);
      }
    }
    return result;
  };

  // Group by any fields that are not aggregated
  const groupAccessors = opts.operations
    .filter((op) => !op.aggregate)
    .map((op) => (row: TRow) => {
      return op.select(row);
    });

  const grouped = rollup(opts.rows, reducer, ...groupAccessors);
  return flattenMap(grouped);
}

// Convert the potentially nested Map structure into an array of objects
function flattenMap(
  map: Map<string, any> | Record<string, any>,
  path: any[] = []
): any[] {
  const result: any[] = [];

  map.forEach((value: Map<string, any> | Record<string, any>, key: string) => {
    const currentPath = [...path, key];

    if (value instanceof Map) {
      // If the value is a Map, recurse deeper
      result.push(...flattenMap(value, currentPath));
    } else {
      // If the value is the aggregation result object, add it to results
      result.push(value);
    }
  });

  return result;
}
