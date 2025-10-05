import { Table, TableValues } from "./constants/dataTypes";
import { DB_KEYWORDS } from "./constants/dbkeywords";
import { ReferenceTable } from "./constants/foreignkeyActions";
import { Primitive } from "./globalTypes";
import {
  AllowedFields,
  TableCreationOptions,
  FindQueryAttributes,
  GroupByFields,
  PreparedValues,
  QueryExtraOptions,
  QueryParams,
  RawQuery,
} from "./internalTypes";
import { ColumnHelper } from "./methods/columnHelper";
import { errorHandler, throwError } from "./methods/errorHelper";
import { FieldHelper } from "./methods/fieldHelper";
import {
  covertStrArrayToStr,
  createPlaceholder,
  fieldQuote,
  getPreparedValues,
} from "./methods/helperFunction";
import { pgConnect } from "./methods/pgHelper";
import { QueryHelper } from "./methods/queryHelper";
import { attachArrayWith, resultHandler } from "./methods/util";

//============================================= CONSTANTS ===================================================//
const enumQryPrefix = `DO $$ BEGIN CREATE TYPE`;
const enumQrySuffix = `EXCEPTION WHEN duplicate_object THEN null; END $$;`;

//============================================= DBQuery ===================================================//

export class DBQuery {
  static tableName: string = "";
  static tableColumns: AllowedFields = new Set();

  static async select<Model>(
    queryParams?: QueryParams<Model>,
    options?: Partial<QueryExtraOptions>
  ) {
    const { showQuery } = options || {};
    const preparedValues: PreparedValues = { index: 0, values: [] };
    const groupByFields: GroupByFields = new Set();
    const findAllQuery = QueryHelper.prepareQuery(
      preparedValues,
      this.tableColumns,
      groupByFields,
      this.tableName,
      queryParams || {}
    );
    try {
      const result = await pgConnect.connection.query({
        query: findAllQuery,
        params: preparedValues.values,
        showQuery,
      });
      return resultHandler(null, result.rows);
    } catch (error) {
      return resultHandler(error, {
        query: findAllQuery,
        params: preparedValues.values,
      });
    }
  }

  static async create(
    fields: Record<string, Primitive>,
    options?: Partial<QueryExtraOptions> & { returnOnly?: FindQueryAttributes }
  ) {
    const { showQuery, returnOnly } = options || {};
    const keys: string[] = [];
    const valuePlaceholder: string[] = [];
    const allowedFields = FieldHelper.getAllowedFields(this.tableColumns);
    const returnStr = ColumnHelper.getSelectColumns(allowedFields, returnOnly, {
      isAggregateAllowed: false,
    });
    const preparedValues: PreparedValues = { index: 0, values: [] };
    Object.entries(fields).forEach((entry) => {
      const [key, value] = entry;
      keys.push(fieldQuote(allowedFields, preparedValues, key));
      const placeholder = getPreparedValues(preparedValues, value);
      valuePlaceholder.push(placeholder);
    });
    const columns = attachArrayWith.coma(keys);
    const valuePlaceholders = attachArrayWith.coma(valuePlaceholder);
    const insertClause = `${DB_KEYWORDS.insertInto} "${this.tableName}"(${columns})`;
    const valuesClause = `${DB_KEYWORDS.values}${valuePlaceholders}`;
    const returningClause = `${DB_KEYWORDS.returning} ${returnStr}`;
    const createQry = attachArrayWith.space([
      insertClause,
      valuesClause,
      returningClause,
    ]);
    try {
      const result = await pgConnect.connection.query({
        query: createQry,
        params: preparedValues.values,
        showQuery,
      });
      return { rows: result.rows, count: result.rowCount };
    } catch (error) {
      return errorHandler(createQry, preparedValues.values, error as Error);
    }
  }

  static async createBulk(
    columns: Array<string>,
    values: Array<Array<Primitive>>,
    options?: Partial<QueryExtraOptions> & { returnOnly?: FindQueryAttributes }
  ) {
    const { showQuery, returnOnly } = options || {};
    const flatedValues: Primitive[] = [];
    const allowedFields = FieldHelper.getAllowedFields(this.tableColumns);
    const returnStr = ColumnHelper.getSelectColumns(allowedFields, returnOnly, {
      isAggregateAllowed: false,
    });
    let incrementBy = 1;
    const valuePlaceholder = values.map((val, pIndex) => {
      if (val.length !== columns.length) {
        return throwError.invalidColumnLenType(
          pIndex,
          columns.length,
          val.length
        );
      }
      if (pIndex > 0) {
        incrementBy += val.length - 1;
      }
      flatedValues.push(...val);
      const placeholder = attachArrayWith.coma(
        val.map((_, cIndex) => createPlaceholder(pIndex + cIndex + incrementBy))
      );

      return `(${placeholder})`;
    });
    const colStr = attachArrayWith.coma(columns);
    const valuePlaceholders = attachArrayWith.coma(valuePlaceholder);
    const insertClause = `${DB_KEYWORDS.insertInto} "${this.tableName}"(${colStr})`;
    const valuesClause = `${DB_KEYWORDS.values}${valuePlaceholders}`;
    const returningClause = `${DB_KEYWORDS.returning} ${returnStr}`;
    const createQry = attachArrayWith.space([
      insertClause,
      valuesClause,
      returningClause,
    ]);
    try {
      const result = await pgConnect.connection.query({
        query: createQry,
        params: flatedValues,
        showQuery,
      });
      return { rows: result.rows, count: result.rowCount };
    } catch (error) {
      return errorHandler(createQry, flatedValues, error as Error);
    }
  }
}

//============================================= DBQuery ===================================================//

//============================================= DBModel ===================================================//

export class DBModel extends DBQuery {
  static init<T extends string>(
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
      columns.push(DBModel.#createColumn(key, value, primaryKeys, enums));
    });
    // console.log(columns);
    this.tableColumns = tableColumns;
    if (primaryKeys.length <= 0) {
      throwError.invalidPrimaryColType(tableName);
    }
    columns.push(DBModel.#createPrimaryColumn(primaryKeys));
    Object.entries(reference).forEach(([key, ref]) => {
      columns.push(DBModel.#createForeignColumn(key, ref));
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
