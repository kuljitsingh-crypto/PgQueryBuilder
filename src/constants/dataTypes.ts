import { Primitive } from "../globalTypes";
import { functionalDataType } from "../methods/funcitonalDataTypes";
import { ReferenceTable } from "./foreignkeyActions";
import { simpleDataType } from "./simpleDataTypes";

export const PgDataType = {
  ...simpleDataType,
  ...functionalDataType,
} as const;

export type PgDataTypes = (typeof PgDataType)[keyof typeof PgDataType];

export const PgSpecialValue = {
  currentDate: "CURRENT_DATE",
  currentTimestamp: "CURRENT_TIMESTAMP",
  currentTime: "CURRENT_TIME",
  uuidV4: "gen_random_uuid()",
  NaN: "NaN",
  infinity: "Infinity",
  negInfinity: "-Infinity",
};

export type Table<T extends string = string> = {
  [key in T]: {
    type: (typeof PgDataType)[keyof typeof PgDataType];
    primary?: boolean;
    defaultValue?: Primitive;
    unique?: boolean;
    notNull?: boolean;
    check?: string;
    reference?: ReferenceTable;
  };
};

export type TableValues = Table[keyof Table];
