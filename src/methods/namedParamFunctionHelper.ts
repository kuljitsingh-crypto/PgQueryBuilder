import { Primitive } from "../globalTypes";
import {
  AllowedFields,
  CallableFieldParam,
  GroupByFields,
  PreparedValues,
} from "../internalTypes";
import { getInternalContext } from "./ctxHelper";
import { getFieldValue } from "./fieldFunc";
import {
  attachMethodToSymbolRegistry,
  dynamicFieldQuote,
  getValidCallableFieldValues,
  prepareSQLDataType,
} from "./helperFunction";
import { attachArrayWith, isValidArray } from "./util";

const prepareValForNamedParam = (
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  val: unknown
) => {
  const type = isValidArray(val) ? "" : prepareSQLDataType(val);
  let updateVal = getFieldValue(
    null,
    val,
    preparedValues,
    groupByFields,
    allowedFields,
    { treatSimpleObjAsWhereSubQry: false, wrapArrInParenthesis: false }
  );

  if (updateVal === null) {
    return null;
  }

  return attachArrayWith.noSpace([updateVal, type]);
};

export const nameParamFn = (
  name: string,
  val: Primitive | Primitive[] | Record<string, Primitive | Primitive[]>
) => {
  const callable = (options: CallableFieldParam) => {
    const { preparedValues, allowedFields, groupByFields } =
      getValidCallableFieldValues(
        options,
        "preparedValues",
        "groupByFields",
        "allowedFields"
      );
    name = dynamicFieldQuote(name, []);
    const value = attachArrayWith.noSpace([
      name,
      ":=",
      prepareValForNamedParam(
        preparedValues,
        allowedFields,
        groupByFields,
        val
      ),
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
