import { throwError } from "../methods/errorHelper";
import { DML } from "./dml";

export class DQL extends DML {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
