import { rollup } from 'd3-array';
import type { Row } from './types';

export type SummarizeOperation<
  TRow = any,
  TAlias extends string = string,
  TResult = any
> = {
  alias: TAlias;
  select: (row: TRow) => TResult;
  primaryKey?: (row: TRow) => any;
  aggregate?: (values: TResult[]) => any;
};

type OperationReturnType<T extends SummarizeOperation> =
  T['aggregate'] extends (values: any[]) => infer R
    ? R // Return type of aggregate if it exists
    : ReturnType<T['select']>;

export function summarize<
  TRow extends Row,
  // "const" Tell TypeScript to extract as much type information as possible
  // when the input is given as a literal expression
  const TOperations extends SummarizeOperation<TRow, string, any>[],
  // A union of each operation type
  TOperation extends TOperations[number],
  // A union of each alias used in the operations
  TOperationAlias extends TOperation['alias'],
  // The output row
  TResultRow = {
    // The output row will have one property for each alias
    [K in TOperationAlias]: OperationReturnType<
      Extract<TOperation, { alias: K }>
    >;
  }
>(opts: { rows: TRow[]; operations: TOperations }) {
  const reducer = (group: TRow[]) => {
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
  if (!groupAccessors.length) {
    // If there are no keys to group by `rollup` will return a single summary row
    // as a plain object instead of an `InternMap` object.
    return [grouped] as TResultRow[];
  }

  // Otherwise `rollup` will return an `InternMap` which we need to flatten.
  return flattenMap(grouped) as TResultRow[];
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
