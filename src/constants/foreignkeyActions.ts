import { ModelQueryBuilder } from "../classes/model";
import { deferrable } from "./deferrable";
import { relationShip } from "./relationType";

export const foreignKeyActions = {
  noAction: "NO ACTION",
  cascade: "CASCADE",
  restrict: "RESTRICT",
  null: "SET NULL",
  default: "SET DEFAULT",
} as const;

export type ForeignKeyActions =
  (typeof foreignKeyActions)[keyof typeof foreignKeyActions];

export type ReferenceTable = {
  Model: ModelQueryBuilder;
  column: string;
  relationType: keyof typeof relationShip;
  constraint?: string;
  onDelete?: ForeignKeyActions;
  onUpdate?: ForeignKeyActions;
  deferrable?: Pick<
    typeof deferrable,
    "initiallyDeferred" | "initiallyImmediate" | "not"
  >;
};

export type Reference = {
  [parentTable in string]: ReferenceTable;
};
