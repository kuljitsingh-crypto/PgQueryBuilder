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
import {
  appendWithSemicolon,
  attachArrayWith,
  isNonEmptyObject,
  isNonEmptyString,
  isUndefined,
  resultHandler,
} from "./util";

const prepareVariable = (
  results: string[],
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  variables?: DOBlock["variable"]
) => {
  if (isNonEmptyObject(variables)) {
    const vars = Object.entries(variables);
    if (vars.length < 1) {
      return;
    }
    results.push(DB_KEYWORDS.declare);
    vars.forEach(([key, val]) => {
      const isTypeVal =
        isNonEmptyObject(val) &&
        isNonEmptyString((val as any).type) &&
        !isUndefined((val as any).val);
      const type = isTypeVal
        ? convertJSDataToSQLData((val as any).val, (val as any).type)
        : convertJSDataToSQLData(val);
      val = isTypeVal ? (val as any).val : val;
      const value = getFieldValue(
        null,
        val,
        preparedValues,
        groupByFields,
        allowedFields,
        {
          wildcardColumn: true,
          wrapArrInParenthesis: false,
          treatSimpleObjAsWhereSubQry: false,
          preparedValReq: false,
        }
      );
      if (type) {
        const variable = attachArrayWith.noSpace(
          [key, " ", type, ":=", value, ";"],
          false
        );
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
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  #execute(params: DOBlock) {
    const preparedValues: PreparedValues = { values: [], index: 0 };
    const allowedFields: Set<string> = new Set();
    const groupByFields: Set<string> = new Set();
    const endStr = appendWithSemicolon(DB_KEYWORDS.end);
    const { variable, body, onExceptions, language = "plpgsql" } = params;
    const results: string[] = [DB_KEYWORDS.do, "$$"];
    prepareVariable(
      results,
      preparedValues,
      allowedFields,
      groupByFields,
      variable
    );
    results.push(DB_KEYWORDS.begin);
    prepareQueries(results, body);
    prepareExceptions(results, onExceptions);
    results.push(endStr, "$$", DB_KEYWORDS.language, supportedLang[language]);
    return {
      query: appendWithSemicolon(attachArrayWith.space(results)),
      params: preparedValues.values,
    };
  }

  /**
 * 
 * @param {object} params
 * @param {DOBlock['body']} params.body
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
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
