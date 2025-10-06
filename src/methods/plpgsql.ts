import { DB_KEYWORDS } from "../constants/dbkeywords";
import { pgException } from "../constants/exceptions";
import { supportedLang } from "../constants/language";
import {
  AllowedFields,
  DOBlock,
  GroupByFields,
  PGSQlVariable,
  PreparedValues,
} from "../internalTypes";
import { getFieldValue } from "./fieldFunc";
import { convertJSDataToSQLData } from "./helperFunction";
import {
  appendWithSemicolon,
  attachArrayWith,
  isNonEmptyObject,
  isNonEmptyString,
  isUndefined,
  toPgStr,
} from "./util";

const prepareVariable = (
  isConstant: boolean,
  results: string[],
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  variables?: PGSQlVariable
) => {
  if (isNonEmptyObject(variables)) {
    const vars = Object.entries(variables);
    if (vars.length < 1) {
      return;
    }
    const ctMaybe = isConstant ? [DB_KEYWORDS.constant] : [];
    vars.forEach(([key, val]) => {
      const isTypeVal =
        isNonEmptyObject(val) && isNonEmptyString((val as any).typ);
      const type = isTypeVal
        ? convertJSDataToSQLData((val as any).val, (val as any).typ)
        : convertJSDataToSQLData(val);
      val = isTypeVal ? (val as any).val : val;
      const value = val
        ? getFieldValue(
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
              arrayTypeCastingReq: false,
            }
          )
        : undefined;
      const valMaybe = !isUndefined(val) ? [":=", value] : [];
      if (type) {
        const variable = appendWithSemicolon(
          attachArrayWith.space([key, ...ctMaybe, type, ...(valMaybe as any)])
        );
        results.push(variable);
      }
    });
  }
};

const preparePlpgsqlVariable = (
  results: string[],
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  variables?: PGSQlVariable
) => {
  return prepareVariable(
    false,
    results,
    preparedValues,
    allowedFields,
    groupByFields,
    variables
  );
};

const preparePlpgsqlConstant = (
  results: string[],
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  variables?: PGSQlVariable
) => {
  return prepareVariable(
    true,
    results,
    preparedValues,
    allowedFields,
    groupByFields,
    variables
  );
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

export class Plpgsql {
  static #calledThroughGetInstance = false;
  #results: string[] = [];
  #lang: string = supportedLang.plpgsql;
  #preparedValues: PreparedValues = { values: [], index: 0 };
  #allowedFields: AllowedFields = new Set();
  #groupByFields: GroupByFields = new Set();
  #isMainBlock = false;
  #blockName = "";

  constructor() {
    if (!Plpgsql.#calledThroughGetInstance) {
      throw new Error(
        "You cannot create instance of Plpgsql using new Plpgsql()."
      );
    }
  }
  static #getInstance() {
    Plpgsql.#calledThroughGetInstance = true;
    const obj = new Plpgsql();
    Plpgsql.#calledThroughGetInstance = false;
    return obj;
  }
  static printMsg(msg: string, ...params: string[]) {
    const varPlaceholder =
      params.length > 0 ? attachArrayWith.coma(["", ...params], false) : "";
    return appendWithSemicolon(
      attachArrayWith.space([
        DB_KEYWORDS.raiseNotice,
        toPgStr(msg),
        varPlaceholder,
      ])
    );
  }
  static doMainBlock(lang?: keyof typeof supportedLang) {
    const instance = Plpgsql.#getInstance();
    instance.#lang = (lang && supportedLang[lang]) || supportedLang.plpgsql;
    instance.#isMainBlock = true;
    instance.#results.push(DB_KEYWORDS.do);
    instance.#results.push("$$");
    return instance;
  }
  static mainBlock(lang?: keyof typeof supportedLang) {
    const instance = Plpgsql.#getInstance();
    instance.#lang = (lang && supportedLang[lang]) || supportedLang.plpgsql;
    instance.#isMainBlock = true;
    instance.#results.push("$$");
    return instance;
  }
  static subBlock(blockName: string) {
    const instance = Plpgsql.#getInstance();
    instance.#isMainBlock = false;
    instance.#blockName = blockName;
    blockName = `<<${blockName}>>`;
    instance.#results.push(blockName);
    return instance;
  }

  declare(params: { variables?: PGSQlVariable; constants?: PGSQlVariable }) {
    const { variables, constants } = params;
    const rs: string[] = [];
    preparePlpgsqlVariable(
      rs,
      this.#preparedValues,
      this.#allowedFields,
      this.#groupByFields,
      variables
    );
    preparePlpgsqlConstant(
      rs,
      this.#preparedValues,
      this.#allowedFields,
      this.#groupByFields,
      constants
    );
    if (rs.length > 0) {
      this.#results.push(DB_KEYWORDS.declare);
      this.#results.push(...rs);
    }
    return this;
  }
  body(body?: string | { query: string; params: any[] }) {
    this.#results.push(DB_KEYWORDS.begin);
    if (isNonEmptyString(body)) {
      this.#results.push(body);
    } else if (isNonEmptyString(body?.query)) {
      this.#results.push(body.query);
      this.#preparedValues.values.push(...body.params);
      this.#preparedValues.index += body.params.length;
    }
    return this;
  }
  exception(exceptions: { [Key in keyof typeof pgException]?: string | null }) {
    prepareExceptions(this.#results, exceptions);
    return this;
  }
  end() {
    const endStr = appendWithSemicolon(
      attachArrayWith.space([DB_KEYWORDS.end, this.#blockName])
    );
    this.#results.push(endStr);
    if (this.#isMainBlock) {
      this.#results.push("$$", DB_KEYWORDS.language, this.#lang);
    }
    let resultStr = attachArrayWith.space(this.#results);
    if (this.#isMainBlock) {
      resultStr = appendWithSemicolon(resultStr);
    }
    return { query: resultStr, params: this.#preparedValues.values };
  }
}
