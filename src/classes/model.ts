import { throwError } from "../methods/errorHelper";
import { DBMiddleware } from "./middleware";

export class ModelQueryBuilder extends DBMiddleware {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
