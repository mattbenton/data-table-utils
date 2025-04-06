import type { Row, PrefixKeys } from './types';

export function compose<TInput>(input: TInput) {
  return {
    pipe: <TOutput>(next: (value: TInput) => TOutput) => {
      const value = next(input);
      return compose(value);
    },
    build: () => input
  };
}

export function prefixKeys<
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

// function namespaceRows<
//   TNamespace extends string,
//   TRow extends Row,
//   TResultRow = Record<TNamespace, TRow>
// >(namespace: TNamespace, rows: TRow[]): TResultRow[] {
//   return rows.map((row) => {
//     return { [namespace]: row } as TResultRow;
//   });
// }
