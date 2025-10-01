import { Pool } from "pg";
import { isNonNullableValue } from "./util";
import { throwError } from "./errorHelper";

export class PgConnectionPool {
  #pool: Pool | null = null;
  constructor(params: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
  }) {
    this.#pool = new Pool({
      host: params.host,
      user: params.user,
      password: params.password,
      database: params.database,
      port: params.port || 5432,
    });
  }

  get pool() {
    if (isNonNullableValue(this.#pool)) {
      return this.#pool;
    }
    return throwError.invalidDBInitiationType();
  }

  getClient() {
    return this.pool.connect();
  }

  async query(params: { query: string; params?: any[]; showQuery?: boolean }) {
    const { query, params: preparedParams = [], showQuery = false } = params;
    const result = await this.pool.query(query, preparedParams);
    if (showQuery) {
      console.log("executed query", {
        query,
        params: preparedParams,
      });
    }
    return result;
  }
}
