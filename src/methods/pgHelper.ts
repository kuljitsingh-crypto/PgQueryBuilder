import { PgConnectionPool } from "./connectionPool";
import { throwError } from "./errorHelper";
import { isNonNullableValue } from "./util";

class PgConnect {
  static #instance: PgConnect | null = null;
  #connection: PgConnectionPool | null = null;

  constructor() {
    if (PgConnect.#instance === null) {
      PgConnect.#instance = this;
    }
    return PgConnect.#instance;
  }

  set connection(params: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
  }) {
    this.#connection = new PgConnectionPool(params);
    this.#addUUIDExtension();
  }

  get connection(): PgConnectionPool {
    if (isNonNullableValue(this.#connection)) {
      return this.#connection;
    }
    return throwError.invalidDBInitiationType();
  }

  #addUUIDExtension = async () => {
    const qry = 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";';
    await this.connection.query({ query: qry });
  };
}

export const pgConnect = new PgConnect();
