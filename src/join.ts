import type { Row } from './types';

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
