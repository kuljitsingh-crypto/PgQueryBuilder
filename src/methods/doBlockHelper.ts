import { DOBlock } from "../internalTypes";
import { pgConnect } from "./pgHelper";
import { Plpgsql } from "./plpgsql";
import { resultHandler } from "./util";

class DOHelper {
  static #instance: DOHelper | null = null;
  constructor() {
    if (DOHelper.#instance === null) {
      DOHelper.#instance = this;
    }
    return DOHelper.#instance;
  }

  /**
 * 
 * @param {object} params
 * @param {DOBlock['body']} params.body
 * @param {DOBlock['lang']} [params.lang]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['constant']} [params.constant]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  async run(params: DOBlock & { showQuery?: boolean }) {
    let blockStr: string | null = null,
      blockParams: any[] = [];
    const { lang, variable, constant, body, onExceptions } = params || {};
    try {
      const qry = Plpgsql.doMainStart({ lang, body })
        .declare({
          variables: variable,
          constants: constant,
        })
        .exception(onExceptions as any)
        .mainEnd();
      blockStr = qry.query;
      blockParams = qry.params;
      const resp = await pgConnect.connection.query({
        query: blockStr,
        params: blockParams,
        showQuery: params.showQuery,
      });
      return resultHandler(null, resp.rows);
    } catch (error) {
      return resultHandler(error, { query: blockStr, params: blockParams });
    }
  }
}

export const doHelper = new DOHelper();
