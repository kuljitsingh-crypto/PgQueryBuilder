import { DB_KEYWORDS } from "../constants/dbkeywords";
import { pgException } from "../constants/exceptions";
import { supportedLang } from "../constants/language";
import { Primitive } from "../globalTypes";
import {
  AllowedFields,
  CallableField,
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
  isEmptyObject,
  isNonEmptyObject,
  isNonEmptyString,
  isPrimitiveValue,
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

type PrivateState = {
  preparedValues: PreparedValues;
  allowedFields: AllowedFields;
  groupByFields: GroupByFields;
  results: string[];
  lang: string;
  isMainBlock: boolean;
  blockName: string;
  mainIndx: number;
  isBody: boolean;
};
export class Plpgsql {
  static #calledThroughGetInstance = false;
  #state: PrivateState = {
    preparedValues: { values: [], index: 0 },
    groupByFields: new Set(),
    allowedFields: new Set(),
    results: [],
    lang: supportedLang.plpgsql,
    isMainBlock: false,
    blockName: "",
    mainIndx: -1,
    isBody: false,
  };

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

  static #blockStart({
    isMain,
    lang,
    isDoBlock = false,
    blockName,
    isBody = false,
    body = "",
  }: {
    isMain: boolean;
    lang?: keyof typeof supportedLang;
    isDoBlock?: boolean;
    blockName?: string;
    isBody?: boolean;
    body?: string;
  }) {
    const instance = Plpgsql.#getInstance();
    instance.#state.lang =
      (lang && supportedLang[lang]) || supportedLang.plpgsql;
    instance.#state.isMainBlock = isMain;
    instance.#state.isBody = isBody;
    if (isDoBlock) {
      instance.#state.results.push(DB_KEYWORDS.do);
    }
    if (isNonEmptyString(blockName)) {
      blockName = `<<${blockName}>>`;
      instance.#state.results.push(blockName);
    } else if (isMain) {
      instance.#state.results.push("$$");
    }
    if (!isBody) {
      instance.#state.mainIndx = instance.#state.results.length;
      instance.#state.results.push(DB_KEYWORDS.begin);
      instance.#state.results.push(body);
    }
    return instance;
  }
  static doMain(params?: { lang?: keyof typeof supportedLang; body?: string }) {
    const { lang, body } = params || {};
    return Plpgsql.#blockStart({ isMain: true, isDoBlock: true, lang, body });
  }
  static main(params?: { lang?: keyof typeof supportedLang; body?: string }) {
    const { lang, body } = params || {};
    return Plpgsql.#blockStart({ isMain: true, isDoBlock: false, lang, body });
  }

  static body() {
    return Plpgsql.#blockStart({
      isMain: false,
      isDoBlock: false,
      isBody: true,
    });

    // this.#results.push(DB_KEYWORDS.begin);
    // if (isNonEmptyString(body)) {
    //   this.#results.push(body);
    // } else if (isNonEmptyString(body?.query)) {
    //   this.#results.push(body.query);
    //   this.#preparedValues.values.push(...body.params);
    //   this.#preparedValues.index += body.params.length;
    // }
    // return this;
  }
  block(blockName: string) {
    this.#state.results.push(blockName);
    return;
  }

  declare(params: { variables?: PGSQlVariable; constants?: PGSQlVariable }) {
    if (this.#state.mainIndx < 0) {
      return this;
    }
    const { variables, constants } = params;
    const rs: string[] = [];
    preparePlpgsqlVariable(
      rs,
      this.#state.preparedValues,
      this.#state.allowedFields,
      this.#state.groupByFields,
      variables
    );
    preparePlpgsqlConstant(
      rs,
      this.#state.preparedValues,
      this.#state.allowedFields,
      this.#state.groupByFields,
      constants
    );
    if (rs.length > 0) {
      this.#state.results.splice(
        this.#state.mainIndx,
        0,
        DB_KEYWORDS.declare,
        ...rs
      );
    }
    return this;
  }

  exception(exceptions: { [Key in keyof typeof pgException]?: string | null }) {
    prepareExceptions(this.#state.results, exceptions);
    return this;
  }

  assign(values: Record<string, Primitive | CallableField>) {
    if (isEmptyObject(values)) {
      return this;
    }
    Object.entries(values).forEach(([key, val]) => {
      val = getFieldValue(
        null,
        val,
        this.#state.preparedValues,
        this.#state.groupByFields,
        this.#state.allowedFields,
        { preparedValReq: false }
      );
      this.#state.results.push(
        appendWithSemicolon(attachArrayWith.space([key, "=", val]))
      );
    });
    return this;
  }

  log(msg: string, ...params: string[]) {
    const varPlaceholder =
      params.length > 0 ? attachArrayWith.coma(["", ...params], false) : "";
    const finalMsg = appendWithSemicolon(
      attachArrayWith.space([
        DB_KEYWORDS.raiseNotice,
        toPgStr(msg),
        varPlaceholder,
      ])
    );
    this.#state.results.push(finalMsg);
    return this;
  }

  endBlock() {
    const endStr = appendWithSemicolon(
      attachArrayWith.space([DB_KEYWORDS.end, this.#state.blockName])
    );
    this.#state.results.push(endStr);
    return this;
  }
  endBody() {
    return attachArrayWith.space(this.#state.results);
  }

  endMain() {
    const endStr = appendWithSemicolon(
      attachArrayWith.space([DB_KEYWORDS.end, this.#state.blockName])
    );
    this.#state.results.push(endStr);
    if (this.#state.isMainBlock) {
      this.#state.results.push("$$", DB_KEYWORDS.language, this.#state.lang);
    }
    let resultStr = attachArrayWith.space(this.#state.results);
    if (this.#state.isMainBlock) {
      resultStr = appendWithSemicolon(resultStr);
    }
    return { query: resultStr, params: this.#state.preparedValues.values };
  }
}
