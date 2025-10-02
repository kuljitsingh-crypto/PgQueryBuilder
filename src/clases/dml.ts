import { throwError } from "../methods/errorHelper";
import { DDL } from "./ddl";

export class DML extends DDL {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
