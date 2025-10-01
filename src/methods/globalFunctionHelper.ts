import { aggregateFn } from "./aggregateFunctionHelper";
import { arrayFn } from "./arrayFunctionHelepr";
import { colFn } from "./columnFunctionHelepr";
import {
  executeDoBlock as executeDo,
  runDoBlock as runDo,
} from "./doBlockHelper";
import { fieldFn } from "./fieldFunctionHelper";
import { fromJsonStr, toJsonStr } from "./jsonFunctionHelepr";
import { jsonPathFn } from "./jsonPathHelper";
import { JPathBuilder } from "./jsonQueryBuilder";
import { typeCastFn } from "./typeCastHelper";
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
}

class GlobalFunction {
  static #instance: GlobalFunction | null = null;

  constructor() {
    if (GlobalFunction.#instance === null) {
      GlobalFunction.#instance = this;
      this.cast = typeCastFn;
      this.window = windowFn;
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
  createCustomType(name: string) {}

  /**
 * 
 * @param {object} params
 * @param {DOBlock['queries']} params.queries
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  buildDoBlock(
    ...args: Parameters<typeof executeDo>
  ): ReturnType<typeof executeDo> {
    return executeDo(...args);
  }
  /* 
 * @param {object} params
 * @param {DOBlock['queries']} params.queries
 * @param {DOBlock['language']} [params.language]
 * @param {DOBlock['variable']} [params.variable]
 * @param {DOBlock['onExceptions']} [params.onExceptions ]- If You wan to raise custom error Message. Pass message as value,
   If you did not want to do anything pass null as value. If Leave undefined, raise default exception message.
 */
  async runDoBlock(
    ...args: Parameters<typeof runDo>
  ): ReturnType<typeof runDo> {
    return runDo(...args);
  }
}

export const fn = new GlobalFunction();
