import { DB_KEYWORDS } from "../constants/dbkeywords";
import { simpleDataType } from "../constants/simpleDataTypes";
import { Primitive } from "../globalTypes";
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
  ): any {
    const dimnStr = range(1, dimension).map((_) => "[]");
    return `${type} ${dimnStr}`;
  },
  enum(values: Primitive[]): any {
    const valueStr = values
      .filter(filterOutValidDbData())
      .map((v) => `'${v}'`)
      .join(",");
    return `${DB_KEYWORDS.enum}(${valueStr})`;
  },
  custom(name: string): any {
    return name;
  },
} as const;
