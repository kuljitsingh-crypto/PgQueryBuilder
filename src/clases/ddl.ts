import { Table, TableValues } from "../constants/dataTypes";
import { DB_KEYWORDS } from "../constants/dbkeywords";
import { ReferenceTable } from "../constants/foreignkeyActions";
import {
  AllowedFields,
  QueryExtraOptions,
  TableCreationOptions,
} from "../internalTypes";
import { throwError } from "../methods/errorHelper";
import {
  attachArrayWith,
  covertStrArrayToStr,
} from "../methods/helperFunction";
import { pgConnect } from "../methods/pgHelper";
import { DCL } from "./dcl";

const enumQryPrefix = `DO $$ BEGIN CREATE TYPE`;
const enumQrySuffix = `EXCEPTION WHEN duplicate_object THEN null; END $$;`;

export class DDL extends DCL {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
  static createTable<T extends string>(
    modelObj: Table<T>,
    option: TableCreationOptions & Partial<QueryExtraOptions>
  ) {
    const { tableName, reference = {}, showQuery } = option;
    this.tableName = tableName;
    const primaryKeys: string[] = [];
    const columns: string[] = [];
    const enums: string[] = [];
    const tableColumns: AllowedFields = new Set();
    Object.entries(modelObj).forEach((entry) => {
      const [key, value] = entry as [T, TableValues];
      tableColumns.add(key);
      columns.push(DDL.#createColumn(key, value, primaryKeys, enums));
    });
    this.tableColumns = tableColumns;
    if (primaryKeys.length <= 0) {
      throwError.invalidPrimaryColType(tableName);
    }
    columns.push(DDL.#createPrimaryColumn(primaryKeys));
    Object.entries(reference).forEach(([key, ref]) => {
      columns.push(DDL.#createForeignColumn(key, ref));
    });
    const createEnumQryPromise = Promise.all(
      enums.map((e) => pgConnect.connection.query({ query: e }))
    );
    const createTableQry = `CREATE TABLE IF NOT EXISTS "${tableName}" (${attachArrayWith.coma(
      columns
    )});`;
    createEnumQryPromise.then(() =>
      pgConnect.connection.query({ query: createTableQry, showQuery })
    );
  }

  static #createColumn(
    columnName: string,
    value: TableValues,
    primaryKeys: string[],
    enums: string[]
  ) {
    const values: (string | boolean)[] = [columnName];
    const colUpr = columnName.toUpperCase();
    Object.entries(value).forEach((entry) => {
      const [key, keyVale] = entry as [keyof TableValues, string | boolean];
      switch (key) {
        case "type": {
          if ((keyVale as any).startsWith("ENUM")) {
            const enumQry = `${enumQryPrefix} ${colUpr} ${DB_KEYWORDS.as} ${keyVale}; ${enumQrySuffix}`;
            enums.push(enumQry);
            values.push(colUpr);
          } else {
            values.push(keyVale);
          }
          break;
        }
        case "primary":
          primaryKeys.push(columnName);
          break;
        case "defaultValue":
          values.push(`${DB_KEYWORDS.default} ${keyVale}`);
          break;
        case "unique":
          values.push(DB_KEYWORDS.unique);
          break;
        case "notNull":
          values.push(DB_KEYWORDS.notNull);
          break;
        case "check":
          values.push(`${DB_KEYWORDS.check} (${keyVale})`);
          break;
      }
    });
    return attachArrayWith.space(values);
  }
  static #createPrimaryColumn(primaryKeys: string[]) {
    return `${DB_KEYWORDS.primaryKey} (${attachArrayWith.coma(primaryKeys)})`;
  }
  static #createForeignColumn(parentTable: string, ref: ReferenceTable) {
    const { parentColumn, column, constraintName, onDelete, onUpdate } = ref;
    const colStr = covertStrArrayToStr(column);
    const parentColStr = covertStrArrayToStr(parentColumn);
    const values: string[] = [];
    if (constraintName) {
      values.push(`${DB_KEYWORDS.constraint} ${constraintName}`);
    }
    values.push(`${DB_KEYWORDS.foreignKey} (${colStr})`);
    values.push(`${DB_KEYWORDS.references} "${parentTable}" (${parentColStr})`);
    if (onDelete) {
      values.push(`${DB_KEYWORDS.onDelete} ${onDelete}`);
    }
    if (onUpdate) {
      values.push(`${DB_KEYWORDS.onUpdate} ${onUpdate}`);
    }
    return attachArrayWith.space(values);
  }
}
