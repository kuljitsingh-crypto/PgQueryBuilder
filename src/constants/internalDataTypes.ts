import { filterOutValidDbData, range } from '../methods/util';

export const simpleDataType = {
  boolean: 'BOOLEAN',
  true: 'TRUE',
  false: 'FALSE',
  text: 'TEXT',
  real: 'REAL',
  smallInt: 'SMALLINT',
  int: 'INTEGER',
  bigInt: 'BIGINT',
  serial: 'SERIAL',
  bigSerial: 'BIGSERIAL',
  smallSerial: 'SMALLSERIAL',
  double: 'DOUBLE PRECISION',
  float: 'FLOAT',
  float8: 'FLOAT8',
  date: 'DATE',
  timestamp: 'TIMESTAMP',
  timestamptz: 'TIMESTAMPTZ',
  time: 'TIME',
  json: 'JSON',
  jsonb: 'JSONB',
  uuid: 'UUID',
  null: 'NULL',
  hstore: 'HSTORE',
  bytea: 'BYTEA',
  inet: 'INET',
  cidr: 'CIDR',
  macaddr: 'MACADDR',
  macaddr8: 'MACADDR8',
  point: 'POINT',
  line: 'LINE',
  lseg: 'LINE SEGMENT',
  lineSegment: 'LINE SEGMENT',
  box: 'BOX',
  path: 'PATH',
  polygon: 'POLYGON',
  circle: 'CIRCLE',
  int4Range: 'INT4RANGE',
  int8Range: 'INT8RANGE',
  numRange: 'NUMRANGE',
  tsRange: 'TSRANGE',
  tstzRange: 'TSTZRANGE',
  dateRange: 'DATERANGE',
} as const;

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
    dimension: number,
  ) {
    const dimnStr = range(1, dimension).map((_) => '[]');
    return `${type} ${dimnStr}`;
  },
  enum(values: string[]): any {
    const valueStr = values
      .filter(filterOutValidDbData())
      .map((v) => `'${v}'`)
      .join(',');
    return `ENUM(${valueStr})`;
  },
} as const;
