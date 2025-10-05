import { PgDataType } from "../constants/dataTypes";
import { DB_KEYWORDS } from "../constants/dbkeywords";
import { Primitive } from "../globalTypes";
import {
  AllowedFields,
  CallableField,
  CaseSubquery,
  GroupByFields,
  InOperationSubQuery,
  PreparedValues,
  WhereClause,
} from "../internalTypes";
import { TableFilter } from "./filterHelper";
import {
  fieldQuote,
  getPreparedValues,
  prepareSQLDataType,
  validCallableColCtx,
} from "./helperFunction";
import { toJsonStr } from "./jsonFunctionHelepr";
import { QueryHelper } from "./queryHelper";
import {
  attachArrayWith,
  isCallableColumn,
  isColAliasNameArr,
  isNonEmptyObject,
  isNonEmptyString,
  isPrimitiveValue,
  isValidArray,
  isValidCaseQuery,
  isValidSubQuery,
  isValidWhereQuery,
} from "./util";

export type ArrayArg<P, Model> =
  | P
  | InOperationSubQuery<Model, "WhereNotReq", "single">
  | CallableField;

export type Arg<Model, P extends Primitive = Primitive> =
  | P
  | InOperationSubQuery<Model, "WhereNotReq", "single">
  | CallableField
  | CaseSubquery<Model>
  | WhereClause<Model>
  | ArrayArg<P, Model>[]
  | Record<string, any>;

const prepareArrayData = (
  key: string | null,
  arr: unknown[],
  preparedValues: PreparedValues,
  groupByFields: GroupByFields,
  allowedFields: AllowedFields,
  wrapArrInParenthesis: boolean,
  type: string,
  preparedValReq: boolean
) => {
  type = type ? `::${type}[]` : prepareSQLDataType(arr);
  const rawVal = `{${attachArrayWith.coma(arr as any)}}`;
  const arrVal = preparedValReq
    ? getPreparedValues(preparedValues, rawVal)
    : `'${rawVal}'`;
  const finalVal = `${arrVal}${type}`;
  return wrapArrInParenthesis
    ? attachArrayWith.noSpace(["(", finalVal, ")"])
    : finalVal;
};
const prepareObjectData = (
  val: object,
  preparedValues: PreparedValues,
  preparedValReq: boolean
) => {
  const rawVal = toJsonStr(val);
  const finalVal = preparedValReq
    ? getPreparedValues(preparedValues, rawVal)
    : `'${rawVal}'`;
  return finalVal;
};

export const getFieldValue = <Model>(
  key: string | null,
  value: unknown,
  preparedValues: PreparedValues,
  groupByFields: GroupByFields,
  allowedFields: AllowedFields,
  options: {
    isAggregateAllowed?: boolean;
    customAllowedFields?: string[];
    isExistsFilter?: boolean;
    refAllowedFields?: AllowedFields;
    treatStrAsCol?: boolean;
    isFromCol?: boolean;
    treatSimpleObjAsWhereSubQry?: boolean;
    customArrayType?: string;
    wildcardColumn?: boolean;
    wrapArrInParenthesis?: boolean;
    preparedValReq?: boolean;
  } = {}
): string | null => {
  const {
    isExistsFilter = false,
    refAllowedFields,
    treatStrAsCol = false,
    isFromCol = false,
    treatSimpleObjAsWhereSubQry = true,
    customArrayType = "",
    wrapArrInParenthesis = false,
    preparedValReq = true,
    ...callableOptions
  } = options;
  if (treatStrAsCol && isNonEmptyString(value)) {
    return fieldQuote(allowedFields, preparedValues, value, {
      customAllowFields: callableOptions.customAllowedFields,
      wildcardColumn: callableOptions.wildcardColumn,
    });
  } else if (isPrimitiveValue(value)) {
    return preparedValReq
      ? getPreparedValues(preparedValues, value as Primitive)
      : (value as any);
  } else if (isCallableColumn(value)) {
    const { col } = validCallableColCtx(value, {
      allowedFields,
      isAggregateAllowed: true,
      preparedValues,
      groupByFields,
      ...callableOptions,
    });
    return col;
  } else if (isValidCaseQuery(value, { treatSimpleObjAsWhereSubQry })) {
    const v = value as any;
    if (typeof v.else !== "undefined") {
      const elseVal = getFieldValue(
        key,
        v.else,
        preparedValues,
        groupByFields,
        allowedFields
      );
      return attachArrayWith.space([DB_KEYWORDS.else, elseVal]);
    } else if (typeof v.when !== "undefined" && typeof v.then !== "undefined") {
      const query = TableFilter.prepareFilterStatement(
        allowedFields,
        groupByFields,
        preparedValues,
        v.when,
        { isWhereKeywordReq: false }
      );
      const thenVal = getFieldValue(
        key,
        v.then,
        preparedValues,
        groupByFields,
        allowedFields
      );
      return attachArrayWith.space([
        DB_KEYWORDS.when,
        query,
        DB_KEYWORDS.then,
        thenVal,
      ]);
    }
  } else if (isValidSubQuery(value)) {
    const query = QueryHelper.otherModelSubqueryBuilder(
      "",
      preparedValues,
      groupByFields,
      value,
      { isExistsFilter, refAllowedFields }
    );
    return query;
  } else if (isFromCol && isColAliasNameArr(value)) {
    return getFieldValue(
      key,
      value[0],
      preparedValues,
      groupByFields,
      allowedFields,
      options
    );
  } else if (
    treatSimpleObjAsWhereSubQry &&
    isValidWhereQuery(key, value, { treatSimpleObjAsWhereSubQry })
  ) {
    const query = TableFilter.prepareFilterStatement(
      allowedFields,
      groupByFields,
      preparedValues,
      value,
      { customKeyWord: "" }
    );
    return query;
  } else if (isValidArray(value)) {
    return prepareArrayData(
      key,
      value,
      preparedValues,
      groupByFields,
      allowedFields,
      wrapArrInParenthesis,
      customArrayType,
      preparedValReq
    );
  } else if (isNonEmptyObject(value)) {
    return prepareObjectData(value, preparedValues, preparedValReq);
  }
  return null;
};
