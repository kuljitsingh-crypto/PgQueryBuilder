import { throwError } from "../methods/errorHelper";
import { DQL } from "./dql";

export class DTL extends DQL {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
