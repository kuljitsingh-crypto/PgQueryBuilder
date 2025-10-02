import { AllowedFields } from "../internalTypes";
import { throwError } from "../methods/errorHelper";

export class Root {
  static tableName: string = "";
  static tableColumns: AllowedFields = new Set();
  static references = {};

  constructor() {
    return throwError.invalidConstructorType();
  }
}
