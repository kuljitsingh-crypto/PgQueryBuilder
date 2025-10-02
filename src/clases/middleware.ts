import { throwError } from "../methods/errorHelper";
import { DTL } from "./dtl";

export class DBMiddleware extends DTL {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
