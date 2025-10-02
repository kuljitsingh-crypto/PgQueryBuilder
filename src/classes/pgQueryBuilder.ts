import { Primitive } from "../globalTypes";
import { RawQuery } from "../internalTypes";
import { errorHandler, throwError } from "../methods/errorHelper";
import { pgConnect } from "../methods/pgHelper";
import { RawQueryHandler } from "../methods/rawQueryHelper";
import { ModelQueryBuilder } from "./model";

export class PgQueryBuilder {
  constructor() {
    return throwError.invalidConstructorType();
  }
  static Model = ModelQueryBuilder;
  static connect = (params: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
  }) => {
    pgConnect.connection = params;
  };
  static async rawQuery(
    qry: RawQuery = {} as RawQuery,
    params: Primitive[] = [],
    showQuery = false
  ) {
    const { query: rawQry, values } = RawQueryHandler.buildRawQuery(
      qry,
      params
    );
    try {
      const result = await pgConnect.connection.query({
        query: rawQry,
        params: values,
        showQuery,
      });
      return { rows: result.rows, count: result.rowCount };
    } catch (error) {
      return errorHandler(rawQry, values, error as Error);
    }
  }
}
