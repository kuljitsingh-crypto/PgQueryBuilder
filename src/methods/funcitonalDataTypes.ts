import { simpleDataType } from "../constants/simpleDataTypes";
import { filterOutValidDbData, range } from "./util";

export const functionalDataType = {
  string(n: number): any {
    return `VARCHAR(${n})`;
  },
  char(n: number): any {
    return `CHAR(${n})`;
  },
  numeric(precision: number, scale = 0): any {
    return `NUMERIC(${precision}, ${scale})`;
  },
  decimal(precision: number, scale = 0): any {
    return `DECIMAL(${precision}, ${scale})`;
  },
  array(
    type: (typeof simpleDataType)[keyof typeof simpleDataType],
    dimension: number
  ) {
    const dimnStr = range(1, dimension).map((_) => "[]");
    return `${type} ${dimnStr}`;
  },
  enum(values: string[]): any {
    const valueStr = values
      .filter(filterOutValidDbData())
      .map((v) => `'${v}'`)
      .join(",");
    return `ENUM(${valueStr})`;
  },
} as const;
