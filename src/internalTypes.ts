import { DB_KEYWORDS_TYPE } from "./constants/dbkeywords";
import { pgException } from "./constants/exceptions";
import { supportedLang } from "./constants/language";
import {
  ARRAY_OP_KEYS,
  PRIMITIVE_OP_KEYS,
  SIMPLE_OP_KEYS,
  SUBQUERY_OP_KEYS,
} from "./constants/operators";
import { SetOperationType } from "./constants/setOperations";
import { TableJoinType } from "./constants/tableJoin";
import { Primitive } from "./globalTypes";

type ColumnRef = `${string}.${string}` | string;
type BaseColumn = ColumnRef;
type TargetColumn = ColumnRef;

export type Nullable = null | undefined;
export type SubqueryWhereReq = "WhereReq" | "WhereNotReq";
export type SubqueryMultiColFlag = "multi" | "single";
export type NonNullPrimitive = string | number | boolean;
export type ORDER_OPTION = "ASC" | "DESC";
export type NULL_OPTION = "NULLS FIRST" | "NULLS LAST";
export type PAGINATION = { limit: number; offset?: number };
export type GroupByFields = Set<string>;
export type AllowedFields = Set<string>;
export type FieldMetadata = { isJSONField?: boolean };

export type ModelAndAlias<Model> = {
  model?: DerivedModel<Model>;
  alias?: string;
};

export type DBField<Model> =
  | Primitive
  | CallableField
  | InOperationSubQuery<Model, "WhereNotReq", "single">;

export type ORDER_BY<Model> = Array<
  | DBField<Model>
  | [DBField<Model>, ORDER_OPTION]
  | [DBField<Model>, ORDER_OPTION, NULL_OPTION]
>;

export type PreparedValues = {
  index: number;
  values: Array<Primitive | Primitive[]>;
};

export type SubQueryFilterKey = DB_KEYWORDS_TYPE["any" | "all"];
export type SubQueryFilterRecord<Model> = {
  [key in SubQueryFilterKey]?:
    | SubQueryFilter<Model, "WhereNotReq">
    | Array<Primitive>;
};
export type FilterColumnValue<Model> =
  | Primitive
  | CallableField
  | SubQueryFilterRecord<Model>;
export type FilterColumnValueWithSubQuery<Model> =
  | Primitive
  | SubQueryFilterRecord<Model>
  | InOperationSubQuery<Model, "WhereNotReq", "single">
  | CallableField;

export type FilterColumnValueWithArray<Model> =
  | Primitive
  | SubQueryFilterRecord<Model>
  | Primitive[];

export type ConditionMap<Model, T extends SubqueryWhereReq = "WhereNotReq"> = {
  in: Primitive[] | InOperationSubQuery<Model, T, "single">;
  notIn: Primitive[] | InOperationSubQuery<Model, T, "single">;
  between: (Primitive | InOperationSubQuery<Model, T, "single">)[];
  notBetween: (Primitive | InOperationSubQuery<Model, T, "single">)[];
  $matches: Array<[string | CallableField, Condition<Model>]>;
  jsonbContains: Record<string, Primitive | Primitive[]>;
  jsonbContainsBy: Record<string, Primitive | Primitive[]>;
  arrayContains: Primitive[] | InOperationSubQuery<Model, T, "single">;
  arrayContainsBy: Primitive[] | InOperationSubQuery<Model, T, "single">;
  arrayOverlap: Primitive[] | InOperationSubQuery<Model, T, "single">;
  jsonbHasKey: string;
  jsonbHasAny: string[];
  jsonbHasAll: string[];
  jsonbMatch: string;
  jsonbExists: string;
  isNull: null;
  notNull: null;
  isTrue: null;
  isFalse: null;
  isUnknown: null;
  notUnknown: null;
  notTrue: null;
  notFalse: null;
};

export type NormalOperators<Model> =
  | {
      [key in Exclude<
        SIMPLE_OP_KEYS,
        keyof ConditionMap<Model>
      >]?: FilterColumnValue<Model>;
    }
  | FilterColumnValue<Model>;

export type NormalOperatorsWithSubquery<Model> = {
  [key in SUBQUERY_OP_KEYS]?: FilterColumnValueWithSubQuery<Model>;
};

export type Condition<
  Model,
  Key extends SIMPLE_OP_KEYS = SIMPLE_OP_KEYS,
> = Key extends keyof ConditionMap<Model>
  ? { [K in Key]: ConditionMap<Model>[K] }
  : Key extends SUBQUERY_OP_KEYS
    ? NormalOperatorsWithSubquery<Model>
    : Key extends PRIMITIVE_OP_KEYS
      ? { [K in Key]: string }
      : Key extends ARRAY_OP_KEYS
        ? { [K in Key]: FilterColumnValueWithArray<Model> }
        : NormalOperators<Model>;

export type ExistsFilter<
  Model,
  T extends SubqueryWhereReq = "WhereNotReq",
> = ModelAndAlias<Model> & Subquery<Model, T>;

export type SubQueryFilter<
  Model,
  T extends SubqueryWhereReq = "WhereNotReq",
  M extends SubqueryMultiColFlag = "single",
> = ExistsFilter<Model, T> & {
  orderBy?: ORDER_BY<Model>;
  isDistinct?: boolean;
} & (M extends "single"
    ? { column: SubQueryColumnAttribute }
    : { columns: FindQueryAttributes });

export type InOperationSubQuery<
  Model,
  T extends SubqueryWhereReq,
  M extends SubqueryMultiColFlag,
> = SubQueryFilter<Model, T, M>;

export type CaseSubquery<Model> =
  | {
      when: WhereClause<Model>;
      then:
        | Primitive
        | CallableField
        | WhereClause<Model>
        | InOperationSubQuery<Model, "WhereNotReq", "single">;
    }
  | {
      else:
        | Primitive
        | CallableField
        | WhereClause<Model>
        | InOperationSubQuery<Model, "WhereNotReq", "single">;
    };

export type SelfJoinSubQuery<Model> = Subquery<Model, "WhereNotReq"> & {
  orderBy?: ORDER_BY<Model>;
  columns?: FindQueryAttributes;
  isDistinct?: boolean;
  alias?: string;
  modelAlias?: string;
};

export type JoinSubQuery<Model> = SelfJoinSubQuery<Model> & {
  model?: DerivedModel<Model>;
};

export type JoinCond<
  Model,
  T extends SubqueryWhereReq,
  M extends SubqueryMultiColFlag,
> = Record<BaseColumn, TargetColumn | InOperationSubQuery<Model, T, M>>;

export type OtherJoin<Model> = {
  on: JoinCond<Model, "WhereNotReq", "single">;
} & JoinSubQuery<Model>;

export type SelfJoin<Model> = {
  on: JoinCond<Model, "WhereNotReq", "single">;
} & SelfJoinSubQuery<Model>;

export type CrossJoin<Model extends any> = JoinSubQuery<Model>;

export type TableJoin<T extends TableJoinType, Model> = T extends "selfJoin"
  ? SelfJoin<Model>
  : T extends "crossJoin"
    ? CrossJoin<Model>
    : OtherJoin<Model>;

export type JoinQuery<Type extends TableJoinType, Model> =
  | TableJoin<Type, Model>
  | TableJoin<Type, Model>[];

export type Join<Model> = {
  [Type in TableJoinType]: JoinQuery<Type, Model>;
};

export type WhereClause<Model> =
  | {
      [column: string]: Condition<Model>;
    }
  | {
      $and: WhereClause<Model>[];
    }
  | {
      $or: WhereClause<Model>[];
    }
  | {
      $matches: Array<
        CallableField | [string | CallableField, Condition<Model>]
      >;
    }
  | { $exists: ExistsFilter<Model, "WhereReq"> }
  | { $notExists: ExistsFilter<Model, "WhereReq"> };

export type WhereAndOtherSubQuery<
  Model,
  T extends SubqueryWhereReq,
> = (T extends "WhereReq"
  ? { where: WhereClause<Model> }
  : {
      where?: WhereClause<Model>;
    }) & {
  groupBy?: string[];
  limit?: PAGINATION["limit"];
  offset?: PAGINATION["offset"];
  having?: WhereClause<Model>;
};

export type Subquery<
  Model,
  T extends SubqueryWhereReq = "WhereNotReq",
> = (T extends "WhereReq"
  ? { where: WhereClause<Model> }
  : {
      where?: WhereClause<Model>;
    }) & {
  groupBy?: string[];
  limit?: PAGINATION["limit"];
  offset?: PAGINATION["offset"];
  having?: WhereClause<Model>;
} & Partial<Join<Model>> &
  Partial<SetQuery<Model>>;

export type DerivedModel<Model> = Model | DerivedModelQuery<Model>;

// subquery for derived model
type DerivedModelQuery<Model> = {
  model?: DerivedModel<Model>;
  alias?: string;
  columns?: FindQueryAttributes;
  orderBy?: ORDER_BY<Model>;
} & Subquery<Model, "WhereNotReq"> & {
    isDistinct?: boolean;
  };

export type SelectQuery<Model> = {
  columns?: FindQueryAttributes;
  isDistinct?: boolean;
  alias?: string;
  derivedModel?: DerivedModel<Model>;
};

export type SetQuery<Model> = {
  [Type in SetOperationType]: SetOperationFilter<Model>;
};

export type SetQueryArrField<Model> = {
  type: SetOperationType;
} & SetOperationFilter<Model>;

export type AliasSubType = string;

export type SetOperationFilter<Model> = ModelAndAlias<Model> & {
  columns?: FindQueryAttributes;
  orderBy?: ORDER_BY<Model>;
} & Subquery<Model, "WhereNotReq">;

export type WhereClauseKeys = "$and" | "$or" | string;

export type TableCreationOptions = {
  tableName: string;
  timestamps?:
    | boolean
    | Partial<{ createdAt: boolean | string; updatedAt: boolean | string }>;
};

export type CallableFieldParam = Partial<{
  preparedValues: PreparedValues;
  groupByFields: GroupByFields;
  allowedFields: AllowedFields;
  isAggregateAllowed: boolean;
  customAllowedFields: string[];
  wildcardColumn: boolean;
}>;

export type CallableField = (options: CallableFieldParam) => {
  col: string;
  alias: string | null;
  ctx: symbol;
};

export type FindQueryAttribute =
  | [string | CallableField, null | string]
  | string
  | CallableField;

export type SubQueryColumnAttribute = string | CallableField;

export type FindQueryAttributes = FindQueryAttribute[];

export type QueryParams<Model> = SelectQuery<Model> &
  Subquery<Model, "WhereNotReq"> & {
    orderBy?: ORDER_BY<Model>;
  };

export type RawQuery =
  | string
  | {
      table?: string;
      columns?: string[];
      where?: string[];
      groupBy?: string[];
      orderBy?: string[];
      having?: string[];
      distinct?: boolean;
      limit?: number;
      offset?: number;
    };

export type QueryExtraOptions = {
  showQuery: boolean;
};

type DOBlockVar = Primitive | Primitive[] | CallableField | Record<string, any>;

export type DOBlock = {
  variable?: {
    [Key in string]: DOBlockVar | { type: string; val: DOBlockVar };
  };
  onExceptions?: {
    [Key in keyof typeof pgException]?: string | null;
  };
  language?: keyof typeof supportedLang;
  body: string;
};
