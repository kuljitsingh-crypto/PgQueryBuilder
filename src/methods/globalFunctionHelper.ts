import { DB_KEYWORDS } from "../constants/dbkeywords";
import { aggregateFn } from "./aggregateFunctionHelper";
import { arrayFn } from "./arrayFunctionHelepr";
import { colFn } from "./columnFunctionHelepr";
import { doHelper } from "./doBlockHelper";
import { fieldFn } from "./fieldFunctionHelper";
import { fromJsonStr, toJsonStr } from "./jsonFunctionHelepr";
import { jsonPathFn } from "./jsonPathHelper";
import { JPathBuilder } from "./jsonQueryBuilder";
import { typeCastFn } from "./typeCastHelper";
import { UserDefinedType } from "./userDefinedType";
import { frameFn, windowFn } from "./windowFunctionHelper";

type AggrKeys = keyof typeof aggregateFn;
type FrameKeys = keyof typeof frameFn;
type fieldKeys = keyof typeof fieldFn;

type Func = { [k in AggrKeys]: (typeof aggregateFn)[k] } & {
  [k in FrameKeys]: (typeof frameFn)[k];
} & {
  [k in fieldKeys]: (typeof fieldFn)[k];
};

interface GlobalFunction extends Func {
  cast: typeof typeCastFn;
  window: typeof windowFn;
  doBlock: typeof doHelper;
  customDataType: UserDefinedType;
}

class GlobalFunction {
  static #instance: GlobalFunction | null = null;

  constructor() {
    if (GlobalFunction.#instance === null) {
      GlobalFunction.#instance = this;
      this.cast = typeCastFn;
      this.window = windowFn;
      this.doBlock = doHelper;
      this.customDataType = new UserDefinedType();
      this.#attachAggregateFunctions();
      this.#attachFrameFunctions();
      this.#attachFieldFunctions();
    }
    return GlobalFunction.#instance;
  }
  #attachAggregateFunctions() {
    for (let key in aggregateFn) {
      //@ts-ignore
      this[key] = aggregateFn[key];
    }
  }

  #attachFrameFunctions() {
    for (let key in frameFn) {
      //@ts-ignore
      this[key] = frameFn[key];
    }
  }

  #attachFieldFunctions() {
    for (let key in fieldFn) {
      //@ts-ignore
      this[key] = fieldFn[key];
    }
  }

  jPath(...args: Parameters<typeof jsonPathFn>): ReturnType<typeof jsonPathFn> {
    return jsonPathFn(...args);
  }
  col(...args: Parameters<typeof colFn>): ReturnType<typeof colFn> {
    return colFn(...args);
  }
  array(...args: Parameters<typeof arrayFn>): ReturnType<typeof arrayFn> {
    return arrayFn(...args);
  }
  toJsonStr(
    ...args: Parameters<typeof toJsonStr>
  ): ReturnType<typeof toJsonStr> {
    return toJsonStr(...args);
  }

  fromJsonStr(
    ...args: Parameters<typeof fromJsonStr>
  ): ReturnType<typeof fromJsonStr> {
    return fromJsonStr(...args);
  }

  jQuery(root?: string): JPathBuilder {
    const jPathBuilder = new JPathBuilder(root);
    return jPathBuilder;
  }
  raiseNotice(msg: string) {
    return `${DB_KEYWORDS.raiseNotice} '${msg}'`;
  }
}

export const fn = new GlobalFunction();
