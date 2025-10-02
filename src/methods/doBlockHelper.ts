import { DB_KEYWORDS } from "../constants/dbkeywords";
import { pgException } from "../constants/exceptions";
import { supportedLang } from "../constants/language";
import { simpleDataType } from "../constants/simpleDataTypes";
import { DOBlock, PreparedValues } from "../internalTypes";
import { errorHandler } from "./errorHelper";
import { pgConnect } from "./pgHelper";
import {
  attachArrayWith,
  isNonEmptyObject,
  isNonEmptyString,
  isValidArray,
} from "./util";

const prepareVariable = (
  results: string[],
  variables?: DOBlock["variable"]
) => {
  if (isNonEmptyObject(variables)) {
    const vars = Object.entries(variables);
    if (vars.length < 1) {
      return;
    }
    results.push(DB_KEYWORDS.declare);
    vars.forEach(([key, val]) => {
      const type = simpleDataType[val.type];
      if (type) {
        const variable = `${key} ${type}:= ${val.value};`;
        results.push(variable);
      }
    });
  }
};

const prepareExceptions = (
  results: string[],
  exceptions: DOBlock["onExceptions"]
) => {
  if (isNonEmptyObject(exceptions)) {
    const excepn = Object.entries(exceptions);
    if (excepn.length < 1) {
      return;
    }
    results.push(DB_KEYWORDS.exception);
    excepn.forEach(([key, val]) => {
      const exception = (pgException as any)[key];
      if (exception) {
        const msg = isNonEmptyString(val) ? `${val}` : val;
        const expe = `${DB_KEYWORDS.when} ${exception} ${DB_KEYWORDS.then} ${msg};`;
        results.push(expe);
      }
    });
  }
};

const prepareQueries = (results: string[], queries: DOBlock["queries"]) => {
  if (!isValidArray(queries)) {
    return;
  }
  queries.forEach((query) => {
    // query = query.endsWith(";") ? query : query + ";";
    results.push(query);
  });
};

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
 * @param {DOBlock['queries']} params.queries
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  execute(params: DOBlock) {
    const preparedValues: PreparedValues = { values: [], index: 0 };
    const endStr = DB_KEYWORDS.end + ";";
    const { variable, queries, onExceptions, language = "plpgsql" } = params;
    const results: string[] = [DB_KEYWORDS.do, "$$"];
    prepareVariable(results, variable);
    results.push(DB_KEYWORDS.begin);
    prepareQueries(results, queries);
    prepareExceptions(results, onExceptions);
    results.push(endStr, "$$", DB_KEYWORDS.language, supportedLang[language]);
    return {
      query: attachArrayWith.space(results) + ";",
      params: preparedValues.values,
    };
  }

  /**
 * 
 * @param {object} params
 * @param {DOBlock['queries']} params.queries
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  async run(params: DOBlock & { showQuery?: boolean }) {
    const { query: blockStr, params: blockParams } = this.execute(params);
    try {
      const resp = await pgConnect.connection.query({
        query: blockStr,
        params: blockParams,
        showQuery: params.showQuery,
      });
      return resp;
    } catch (error) {
      return errorHandler(blockStr, blockParams, error as Error);
    }
  }
}

export const doHelper = new DOHelper();
