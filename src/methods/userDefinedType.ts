import { DB_KEYWORDS } from "../constants/dbkeywords";
import { foreignKeyActions } from "../constants/foreignkeyActions";
import { Primitive } from "../globalTypes";
import { PreparedValues } from "../internalTypes";
import { doHelper } from "./doBlockHelper";
import { getPreparedValues } from "./helperFunction";
import { toJsonStr } from "./jsonFunctionHelepr";
import { pgConnect } from "./pgHelper";
import {
  appendWithSemicolon,
  attachArrayWith,
  buildCreateQry,
  isEnumDataType,
  isNonEmptyObject,
  isNonEmptyString,
  isNonNullableValue,
  isNullableValue,
  isPrimitiveValue,
  prepareEnumField,
} from "./util";

const toStr = (val: Primitive) => `'${val}'`;

const statusHandler = (err?: any, data?: any) => {
  if (isNullableValue(err)) {
    const dataMaybe = isNonNullableValue(data) ? { result: data } : {};
    return { status: DB_KEYWORDS.success, ...dataMaybe };
  }
  const dataMaybe = isNonNullableValue(data) ? { query: data } : {};
  return Promise.reject({
    status: DB_KEYWORDS.failed,
    reason: err.message,
    ...dataMaybe,
  });
};

export class UserDefinedType {
  async create(params: {
    name: string;
    type: string | { [key in string]: string };
    ignoreIfExists?: boolean;
    showQuery?: boolean;
  }) {
    const { name, type, ignoreIfExists = false, showQuery = false } = params;

    const queryFields: string[] = [],
      types: string[] = [];
    try {
      if (isNonEmptyString(type)) {
        const query = buildCreateQry(name, type);
        await pgConnect.connection.query({ query, showQuery });
        return statusHandler();
      }
      if (isNonEmptyObject(type)) {
        Object.entries(type).forEach(([key, field]) => {
          if (isEnumDataType(field)) {
            const colName = prepareEnumField(key);
            queryFields.push(buildCreateQry(colName, field));
            types.push(attachArrayWith.space([key, colName]));
          } else {
            types.push(attachArrayWith.space([key, field]));
          }
        });
        queryFields.push(
          buildCreateQry(
            name,
            attachArrayWith.noSpace(["(", attachArrayWith.coma(types), ")"])
          )
        );
        const exceptionMaybe = ignoreIfExists
          ? { onExceptions: { duplicateObject: null } }
          : {};
        await doHelper.run({
          queries: queryFields,
          ...exceptionMaybe,
          showQuery,
        });
        return statusHandler();
      }
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async getType(param: { name: string; showQuery?: boolean }) {
    try {
      const { name, showQuery } = param;
      const preparedValues: PreparedValues = { values: [], index: 0 };
      const nameStr = getPreparedValues(preparedValues, name);
      const qry = appendWithSemicolon(
        attachArrayWith.space([
          DB_KEYWORDS.select,
          DB_KEYWORDS.wildcard,
          DB_KEYWORDS.from,
          DB_KEYWORDS.pgType,
          DB_KEYWORDS.where,
          DB_KEYWORDS.typeName,
          "=",
          nameStr,
        ])
      );
      const resp = await pgConnect.connection.query({
        query: qry,
        showQuery,
        params: preparedValues.values,
      });
      return statusHandler(null, resp.rows[0]);
    } catch (err) {
      return statusHandler(err);
    }
  }

  async dropType(param: {
    name: string;
    type: Extract<
      (typeof foreignKeyActions)[keyof typeof foreignKeyActions],
      "CASCADE" | "RESTRICT"
    >;
    showQuery?: boolean;
  }) {
    try {
      const { name, type = "RESTRICT", showQuery } = param;
      const qry = appendWithSemicolon(
        attachArrayWith.space([DB_KEYWORDS.dropType, name, type])
      );
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async dropAttr(param: {
    name: string;
    attrName: string;
    showQuery?: boolean;
  }) {
    try {
      const { name, attrName, showQuery } = param;
      const qry = appendWithSemicolon(
        attachArrayWith.space([
          DB_KEYWORDS.alterType,
          name,
          DB_KEYWORDS.dropAttr,
          attrName,
        ])
      );
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async addValue(params: {
    name: string;
    newValue: Primitive;
    beforeValue?: Primitive;
    afterValue?: Primitive;
    showQuery?: boolean;
  }) {
    try {
      const { name, newValue, beforeValue, afterValue, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.addValue,
        toStr(newValue),
      ];
      if (isPrimitiveValue(beforeValue)) {
        queries.push(DB_KEYWORDS.before, toStr(beforeValue));
      } else if (isPrimitiveValue(afterValue)) {
        queries.push(DB_KEYWORDS.after, toStr(afterValue));
      }
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({
        query: qry,
        showQuery,
      });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async addAttr(params: {
    attrType: string;
    attrName: string;
    name: string;
    showQuery?: boolean;
  }) {
    try {
      const { attrName, attrType: t, name, showQuery } = params;
      let attrType = t;
      if (isEnumDataType(attrType)) {
        attrType = prepareEnumField(attrName);
        const qry = buildCreateQry(attrType, t);
        await pgConnect.connection.query({
          query: qry,
        });
      }
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.addAttr,
        attrName,
        attrType,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async renameType(params: {
    oldName: string;
    newName: string;
    showQuery?: boolean;
  }) {
    try {
      const { oldName, newName, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        oldName,
        DB_KEYWORDS.rename,
        DB_KEYWORDS.to,
        newName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async renameAttr(params: {
    oldAttrName: string;
    newAttrName: string;
    name: string;
    showQuery?: boolean;
  }) {
    try {
      const { oldAttrName, newAttrName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.rename,
        DB_KEYWORDS.attr,
        oldAttrName,
        DB_KEYWORDS.to,
        newAttrName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async renameLabel(params: {
    oldLabelName: string;
    newLabelName: string;
    name: string;
    showQuery?: boolean;
  }) {
    try {
      const { newLabelName, oldLabelName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.rename,
        DB_KEYWORDS.value,
        oldLabelName,
        DB_KEYWORDS.to,
        newLabelName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async changeOwner(params: {
    newOwnerName: string;
    name: string;
    showQuery?: boolean;
  }) {
    try {
      const { newOwnerName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.owner,
        DB_KEYWORDS.to,
        newOwnerName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async setSubtype(params: {
    newSubtype: string;
    name: string;
    showQuery?: boolean;
  }) {
    try {
      const { newSubtype, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.set,
        DB_KEYWORDS.subtype,
        newSubtype,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }
  async setCollation(params: {
    name: string;
    collationName: string;
    showQuery?: boolean;
  }) {
    try {
      const { collationName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.set,
        DB_KEYWORDS.subtype,
        DB_KEYWORDS.collation,
        collationName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async setCanonicalFn(params: {
    name: string;
    functionName: string;
    showQuery?: boolean;
  }) {
    try {
      const { functionName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.set,
        DB_KEYWORDS.canonical,
        DB_KEYWORDS.function,
        functionName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }

  async setSubtypeDiffFn(params: {
    name: string;
    functionName: string;
    showQuery?: boolean;
  }) {
    try {
      const { functionName, name, showQuery } = params;
      const queries = [
        DB_KEYWORDS.alterType,
        name,
        DB_KEYWORDS.set,
        DB_KEYWORDS.subtype,
        DB_KEYWORDS.diff,
        DB_KEYWORDS.function,
        functionName,
      ];
      const qry = appendWithSemicolon(attachArrayWith.space(queries));
      await pgConnect.connection.query({ query: qry, showQuery });
      return statusHandler();
    } catch (err) {
      return statusHandler(err);
    }
  }
}
