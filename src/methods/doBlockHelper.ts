import { DB_KEYWORDS } from "../constants/dbkeywords";
import { pgException } from "../constants/exceptions";
import { supportedLang } from "../constants/language";
import {
  AllowedFields,
  DOBlock,
  GroupByFields,
  PreparedValues,
} from "../internalTypes";
import { getFieldValue } from "./fieldFunc";
import { convertJSDataToSQLData } from "./helperFunction";
import { pgConnect } from "./pgHelper";
import { declarePlpgsqlVariable } from "./pgsqlHelper";
import {
  appendWithSemicolon,
  attachArrayWith,
  isNonEmptyObject,
  isNonEmptyString,
  isUndefined,
  resultHandler,
} from "./util";

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

const prepareQueries = (results: string[], body: DOBlock["body"]) => {
  if (isNonEmptyString(body)) {
    results.push(body);
  }
  return;
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
 * @param {DOBlock['body']} params.body
 * @param {DOBlock['lang']} [params.lang]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['constant']} [params.constant]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  #execute(params: DOBlock) {
    const preparedValues: PreparedValues = { values: [], index: 0 };
    const allowedFields: Set<string> = new Set();
    const groupByFields: Set<string> = new Set();
    const endStr = appendWithSemicolon(DB_KEYWORDS.end);
    const { variable, constant, body, onExceptions, lang = "plpgsql" } = params;
    const results: string[] = [DB_KEYWORDS.do, "$$"];
    declarePlpgsqlVariable(
      results,
      preparedValues,
      allowedFields,
      groupByFields,
      variable,
      constant
    );
    results.push(DB_KEYWORDS.begin);
    prepareQueries(results, body);
    prepareExceptions(results, onExceptions);
    results.push(endStr, "$$", DB_KEYWORDS.language, supportedLang[lang]);
    return {
      query: appendWithSemicolon(attachArrayWith.space(results)),
      params: preparedValues.values,
    };
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
    try {
      const qry = this.#execute(params);
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
