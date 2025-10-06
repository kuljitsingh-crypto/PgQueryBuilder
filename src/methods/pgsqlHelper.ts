import { DB_KEYWORDS } from "../constants/dbkeywords";
import {
  AllowedFields,
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
        isNonEmptyObject(val) &&
        isNonEmptyString((val as any).typ) &&
        !isUndefined((val as any).val);
      const type = isTypeVal
        ? convertJSDataToSQLData((val as any).val, (val as any).typ)
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
          arrayTypeCastingReq: false,
        }
      );
      if (type) {
        const variable = appendWithSemicolon(
          attachArrayWith.space([key, ...ctMaybe, type, ":=", value])
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

export const declarePlpgsqlVariable = (
  results: string[],
  preparedValues: PreparedValues,
  allowedFields: AllowedFields,
  groupByFields: GroupByFields,
  variables?: PGSQlVariable,
  constants?: PGSQlVariable
) => {
  const rs: string[] = [];
  preparePlpgsqlVariable(
    rs,
    preparedValues,
    allowedFields,
    groupByFields,
    variables
  );
  preparePlpgsqlConstant(
    rs,
    preparedValues,
    allowedFields,
    groupByFields,
    constants
  );
  if (rs.length > 0) {
    results.push(DB_KEYWORDS.declare);
    results.push(...rs);
  }
};
