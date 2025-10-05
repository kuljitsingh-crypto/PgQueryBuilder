import { Primitive } from "../globalTypes";
import { CallableFieldParam, PreparedValues } from "../internalTypes";
import { getInternalContext } from "./ctxHelper";
import {
  attachMethodToSymbolRegistry,
  dynamicFieldQuote,
  getPreparedValues,
  getValidCallableFieldValues,
  prepareSQLDataType,
} from "./helperFunction";
import { toJsonStr } from "./jsonFunctionHelepr";
import {
  attachArrayWith,
  isNonEmptyObject,
  isPrimitiveValue,
  isValidArray,
} from "./util";

const prepareValForNamedParam = (
  preparedValues: PreparedValues,
  val: unknown
) => {
  const type = prepareSQLDataType(val);
  let updateVal: string | null = null;
  if (isPrimitiveValue(val)) {
    updateVal = getPreparedValues(preparedValues, val);
  } else if (isValidArray(val)) {
    updateVal = `{${attachArrayWith.coma(val as any)}}`;
  } else if (isNonEmptyObject(val)) {
    updateVal = getPreparedValues(preparedValues, toJsonStr(val));
  }
  if (updateVal === null) {
    return null;
  }

  return attachArrayWith.noSpace([updateVal, type]);
};

export const nameParamFn = (name: string, val: Primitive | Primitive[]) => {
  const callable = (options: CallableFieldParam) => {
    const { preparedValues } = getValidCallableFieldValues(
      options,
      "preparedValues"
    );
    name = dynamicFieldQuote(name, []);
    const value = attachArrayWith.noSpace([
      name,
      ":=",
      prepareValForNamedParam(preparedValues, val),
    ]);
    return {
      col: value,
      alias: null,
      ctx: getInternalContext(),
    };
  };
  attachMethodToSymbolRegistry(callable, "namedParamFn");
  return callable;
};
