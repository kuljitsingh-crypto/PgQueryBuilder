const doubleParamAggregateFunctionName = {
  corr: "CORR",
  covarPop: "COVAR_POP",
  covarSamp: "COVAR_SAMP",
  regrSlope: "REGR_SLOPE",
  regrIntercept: "REGR_INTERCEPT",
  regrCount: "REGR_COUNT",
  regrR2: "REGR_R2",
  regrAvgX: "REGR_AVGX",
  regrAvgY: "REGR_AVGY",
  regrSxx: "REGR_SXX",
  regrSyy: "REGR_SYY",
  regrSxy: "REGR_SXY",
} as const;

const singleParamAggregateFunctionName = {
  min: "min",
  max: "max",
  count: "count",
  avg: "avg",
  sum: "sum",
  boolOr: "bool_or",
  boolAnd: "bool_and",
  arrayAgg: "array_agg",
  stringAgg: "string_agg",
  stdDev: "stddev",
  variance: "variance",
  varPop: "VAR_POP",
  varSamp: "VAR_SAMP",
  stddevPop: "STDDEV_POP",
  stddevSamp: "STDDEV_SAMP",
} as const;

export const aggregateFunctionName = {
  ...singleParamAggregateFunctionName,
  ...doubleParamAggregateFunctionName,
} as const;

export const doubleParamAggrFunctionNames = new Set(
  Object.keys(doubleParamAggregateFunctionName)
);

//=========================================== Window Functions====================================//

// 1. No-arg window functions
export const noArgWindowFns = {
  rowNumber: "ROW_NUMBER",
  rank: "RANK",
  denseRank: "DENSE_RANK",
  percentRank: "PERCENT_RANK",
  cumeDist: "CUME_DIST",
} as const;

// 2. Integer argument only
export const intArgWindowFns = {
  ntile: "NTILE",
} as const;

// 3. Single expression argument
export const exprArgWindowFns = {
  firstValue: "FIRST_VALUE",
  lastValue: "LAST_VALUE",
} as const;

// 4. Expression + extra args
export const exprWithExtraWindowFns = {
  nthValue: "NTH_VALUE", // expr, n
  lag: "LAG", // expr [, offset [, default]]
  lead: "LEAD", // expr [, offset [, default]]
} as const;

export const windowFunctionNames = {
  ...noArgWindowFns,
  ...intArgWindowFns,
  ...exprArgWindowFns,
  ...exprWithExtraWindowFns,
  ...aggregateFunctionName,
};

export const singleExprWindowFns = {
  ...intArgWindowFns,
  ...exprArgWindowFns,
  ...singleParamAggregateFunctionName,
};

export const doubleExprWindowFns = {
  ...doubleParamAggregateFunctionName,
};

//======================================= No Param Field OP ======================================//
export const NO_PRAM_FIELD_OP = {
  now: "NOW",
  clockTimestamp: "CLOCK_TIMESTAMP",
  statementTimestamp: "STATEMENT_TIMESTAMP",
  transactionTimestamp: "TRANSACTION_TIMESTAMP",
  random: "random",
};

export const CURRENT_DATE_FIELD_OP = {
  currentDate: "CURRENT_DATE",
  currentTime: "CURRENT_TIME",
};

//====================================== Single Field Op ======================================//
export const DATE_EXTRACT_FIELD_OP = {
  extractYear: "EXTRACT",
  extractMonth: "EXTRACT",
  extractDay: "EXTRACT",
  extractHour: "EXTRACT",
  extractMinute: "EXTRACT",
  extractSecond: "EXTRACT",
  extractDow: "EXTRACT",
  extractDoy: "EXTRACT",
  extractWeek: "EXTRACT",
  extractQuarter: "EXTRACT",
  extractEpoch: "EXTRACT",
} as const;

export const SINGLE_FIELD_OP = {
  abs: "ABS",
  ceil: "CEIL",
  floor: "FLOOR",
  sqrt: "SQRT",
  exp: "EXP",
  ln: "LN",
  log: "LOG",
  sign: "SIGN",
  degrees: "DEGREES",
  radians: "RADIANS",
  sin: "SIN",
  cos: "COS",
  tan: "TAN",
  upper: "UPPER",
  lower: "LOWER",
  initcap: "INITCAP",
  length: "LENGTH",
  charLength: "CHAR_LENGTH",
  bitLength: "BIT_LENGTH",
  octetLength: "OCTET_LENGTH",
  lTrim: "LTRIM",
  rTrim: "RTRIM",
  reverse: "REVERSE",
  ascii: "ASCII",
  chr: "CHR",
  toHex: "TO_HEX",
  md5: "MD5",
  typeOf: "pg_typeof",
  jsonTypeOf: "json_typeof",
  jsonbTypeOf: "jsonb_typeof",
  jsonKeys: "json_object_keys",
  jsonbKeys: "jsonb_object_keys",
  jsonEntries: "json_each",
  jsonEach: "json_each",
  jsonbEntries: "jsonb_each",
  jsonbEach: "jsonb_each",
  jsonEntriesText: "json_each_text",
  jsonEachText: "json_each_text",
  jsonbEntiresText: "jsonb_each_text",
  jsonbEachText: "jsonb_each_text",
  jsonArrayElements: "json_array_elements",
  jsonbArrayElements: "jsonb_array_elements",
  jsonArrayElementsText: "json_array_elements_text",
  jsonbArrayElementsText: "jsonb_array_elements_text",
  jsonArrayLength: "json_array_length",
  jsonbArrayLength: "jsonb_array_length",
  jsonAgg: "json_agg",
  jsonbAgg: "jsonb_agg",
  toJson: "to_json",
  toJsonb: "to_jsonb",
  jsonbStripNulls: "jsonb_strip_nulls",
  arrayToJson: "array_to_json",
  rowToJson: "row_to_json",
  jsonValid: "json_valid",
  jsonPretty: "json_pretty",
  unnest: "UNNEST",
  hstoreToJson: "hstore_to_json",
  // Needs further work
  // jsonbToRecord: 'jsonb_to_record',
  // jsonToRecord: 'json_to_record',
  // jsonbToRecordSet: 'jsonb_to_recordset',
  // jsonToRecordSet: 'json_to_recordset',
} as const;

export const NOT_FIELD_OP = {
  not: "NOT",
};

//====================================== Double Field Op ======================================//
export const SYMBOL_FIELD_OP = {
  add: "+",
  sub: "-",
  multiple: "*",
  divide: "/",
  modulo: "%",
  exponent: "^",
  jsonConcat: "||",
  jsonbOPPathExists: "@?",
  jsonbOPPathMatch: "@@",
  and: "AND",
  or: "OR",
} as const;

export const DOUBLE_FIELD_OP = {
  trunc: "TRUNC",
  round: "ROUND",
  power: "POWER",
  repeat: "REPEAT",
  left: "LEFT",
  right: "RIGHT",
  dateTrunc: "DATE_TRUNC",
  datePart: "DATE_PART",
  toChar: "TO_CHAR",
  toDate: "TO_DATE",
  toTimestamp: "TO_TIMESTAMP",
  toNumber: "TO_NUMBER",
  nullIf: "NULLIF",
  coalesce: "COALESCE",
  encode: "ENCODE",
  decode: "DECODE",
  mod: "MOD",
  justifyInterval: "JUSTIFY_INTERVAL",
  justifyDays: "JUSTIFY_DAYS",
  justifyHours: "JUSTIFY_HOURS",
  arrayLength: "ARRAY_LENGTH",
  regexpMatches: "REGEXP_MATCHES",
  jsonObjectAgg: "json_object_agg",
  jsonbObjectAgg: "jsonb_object_agg",
  jsonObject: "json_object",
  jsonbObject: "jsonb_object",
  jsonbDelete: "jsonb_delete",
  jsonbDeletePath: "jsonb_delete_path",
  jsonbPathExists: "jsonb_path_exists",
  jsonbPathMatch: "jsonb_path_match",
  jsonbPathQuery: "jsonb_path_query",
  jsonbPathQueryArray: "jsonb_path_query_array",
  jsonbPathQueryFirst: "jsonb_path_query_first",
  jsonbPathExistsTz: "jsonb_path_exists_tz",
  jsonbPathMatchTz: "jsonb_path_match_tz",
} as const;

export const STR_FIELD_OP = {
  strPos: "STRPOS",
} as const;

export const TRIM_FIELD_OP = {
  trim: "TRIM",
} as const;

export const STR_IN_FIELD_OP = { position: "POSITION" } as const;

export const ARRAY_INDEX_OP = {
  at: "at",
};

//====================================== Triple Field Op ======================================//
export const TRIPLE_FIELD_OP = {
  subStr: "SUBSTR",
  replace: "REPLACE",
  translate: "TRANSLATE",
  lPad: "LPAD",
  rPad: "RPAD",
  splitPart: "SPLIT_PART",
  regexpReplace: "REGEXP_REPLACE",
} as const;

export const SUBSTRING_FIELD_OP = {
  substring: "SUBSTRING",
} as const;

export const ARRAY_SLICE_OP = {
  slice: "slice",
};

//====================================== Multiple Field Op ======================================//
export const MULTIPLE_FIELD_OP = {
  concat: "CONCAT",
  age: "AGE",
  greatest: "GREATEST",
  least: "LEAST",
  gcd: "GCD",
  lcm: "LCM",
  jsonBuildArray: "json_build_array",
  jsonbBuildArray: "jsonb_build_array",
  jsonBuildObject: "json_build_object",
  jsonbBuildObject: "jsonb_build_object",
  row: "ROW",
  jsonbSet: "jsonb_set",
  jsonbInsert: "jsonb_insert",
} as const;

export const CASE_FIELD_OP = {
  case: "CASE",
} as const;

export const CUSTOM_FIELD_OP = {
  custom: "custom",
} as const;

//====================================== Helper Constants ======================================//
export const dateExtractFieldMapping = {
  extractYear: "YEAR",
  extractMonth: "MONTH",
  extractDay: "DAY",
  extractHour: "HOUR",
  extractMinute: "MINUTE",
  extractSecond: "SECOND",
  extractDow: "DOW", // Day of week
  extractDoy: "DOY", // Day of year
  extractWeek: "WEEK",
  extractQuarter: "QUARTER",
  extractEpoch: "EPOCH",
};

//====================================== Type Definitions ======================================//

//====================================== No Param Field OP ======================================//
type NoParamOpKeys = keyof typeof NO_PRAM_FIELD_OP;
type CurrentDateOpKeys = keyof typeof CURRENT_DATE_FIELD_OP;

//====================================== Single Field Op ======================================//
type SingleOpKeys = keyof typeof SINGLE_FIELD_OP;
type DateExtractOpKeys = keyof typeof DATE_EXTRACT_FIELD_OP;
type NotFieldKeys = keyof typeof NOT_FIELD_OP;

//====================================== Double Field Op ======================================//
type SymbolOpKeys = keyof typeof SYMBOL_FIELD_OP;
type TrimFieldOpKeys = keyof typeof TRIM_FIELD_OP;
type DoubleOpKeys = keyof typeof DOUBLE_FIELD_OP;
type StrFieldOpKeys = keyof typeof STR_FIELD_OP | keyof typeof STR_IN_FIELD_OP;
type ArrayIndexKeys = keyof typeof ARRAY_INDEX_OP;

//====================================== Triple Field Op ======================================//
type TripleOpKeys = keyof typeof TRIPLE_FIELD_OP;
type SubstringFieldOpKeys = keyof typeof SUBSTRING_FIELD_OP;
type ArraySliceKeys = keyof typeof ARRAY_SLICE_OP;

//====================================== Multiple Field Op ======================================//
type MultipleOpKeys = keyof typeof MULTIPLE_FIELD_OP;
export type CaseOpKeys = keyof typeof CASE_FIELD_OP;
export type CustomFunctionKeys = keyof typeof CUSTOM_FIELD_OP;

export type NoPramFieldOpKeys = NoParamOpKeys | CurrentDateOpKeys;
export type SingleFieldOpKeys = SingleOpKeys | DateExtractOpKeys | NotFieldKeys;

export type DoubleFieldOpKeys =
  | DoubleOpKeys
  | TrimFieldOpKeys
  | StrFieldOpKeys
  | SymbolOpKeys
  | ArrayIndexKeys;

export type TripleFieldOpKeys =
  | TripleOpKeys
  | SubstringFieldOpKeys
  | ArraySliceKeys;

export type MultipleFieldOpKeys =
  | MultipleOpKeys
  | CaseOpKeys
  | CustomFunctionKeys;
export type AggregateFunctionType = keyof typeof aggregateFunctionName;

//==================================== Window Function Types========================================//

export type ZeroParamWindowFunction = keyof typeof noArgWindowFns;
export type SingleParamWindowFunction =
  | keyof typeof intArgWindowFns
  | keyof typeof exprArgWindowFns
  | keyof typeof exprWithExtraWindowFns
  | keyof typeof singleParamAggregateFunctionName;
export type DoubleParamWindowFunction =
  keyof typeof doubleParamAggregateFunctionName;

export type WindowFunctions =
  | ZeroParamWindowFunction
  | SingleParamWindowFunction
  | DoubleParamWindowFunction;
