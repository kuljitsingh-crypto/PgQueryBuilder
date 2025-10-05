import { DB_KEYWORDS } from "../constants/dbkeywords";
import { simpleDataType } from "../constants/simpleDataTypes";
import { Primitive } from "../globalTypes";
import { attachArrayWith, filterOutValidDbData, range, toPgStr } from "./util";

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
  ): any {
    const dimnStr = range(1, dimension).map((_) => "[]");
    return `${type} ${dimnStr}`;
  },
  enum(values: Primitive[]): any {
    const valueStr = attachArrayWith.coma(
      values.filter(filterOutValidDbData()).map(toPgStr)
    );
    return `${DB_KEYWORDS.enum}(${valueStr})`;
  },
  table(rowConfig: Record<string, string>) {
    const rows = Object.entries(rowConfig).map(([key, val]) =>
      attachArrayWith.space([key, val])
    );
    return `${DB_KEYWORDS.table}(${attachArrayWith.coma(rows)})`;
  },
  custom(name: string): any {
    return name;
  },
} as const;
