import { AllowedFields } from "../internalTypes";
import { throwError } from "../methods/errorHelper";

export class Root {
  static tableName: string = "";
  static tableColumns: AllowedFields = new Set();

  constructor() {
    return throwError.invalidConstructorType();
  }
}
