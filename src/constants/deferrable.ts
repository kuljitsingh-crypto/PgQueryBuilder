import { DB_KEYWORDS } from "./dbkeywords";

export const deferrable = {
  initiallyImmediate: "DEFERRABLE INITIALLY IMMEDIATE",
  initiallyDeferred: "DEFERRABLE INITIALLY DEFERRED",
  not: "NOT DEFERRABLE",
  setDeferred(ids: string[] = [DB_KEYWORDS.all]) {
    return `SET CONSTRAINTS ${ids.join(", ")} DEFERRED;`;
  },
  setImmediate(ids: string[] = [DB_KEYWORDS.all]) {
    return `SET CONSTRAINTS ${ids.join(", ")} IMMEDIATE;`;
  },
};
