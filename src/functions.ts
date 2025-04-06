export { sum, mean } from 'd3-array';

export function isValidValue(value: any) {
  return value !== null && value !== undefined && !isNaN(value);
}

export function count<TValues extends Iterable<any>>(
  values: TValues,
  valueof?: (value: any, index: number, values: TValues) => any
) {
  let count = 0;
  if (valueof) {
    let index = -1;
    for (let value of values) {
      value = valueof(value, ++index, values);
      if (isValidValue(value)) {
        count++;
      }
    }
  } else {
    for (let value of values) {
      if (isValidValue(value)) {
        count++;
      }
    }
  }
  return count;
}

export function countDistinct<TValues extends Iterable<any>>(
  values: TValues,
  valueof?: (value: any, index: number, values: TValues) => any
) {
  const uniqueValues = new Set<any>();
  if (valueof) {
    let index = -1;
    for (let value of values) {
      value = valueof(value, ++index, values);
      if (isValidValue(value)) {
        uniqueValues.add(value);
      }
    }
  } else {
    for (let value of values) {
      if (isValidValue(value)) {
        uniqueValues.add(value);
      }
    }
  }
  return uniqueValues.size;
}
