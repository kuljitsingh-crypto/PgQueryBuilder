import { throwError } from "../methods/errorHelper";
import { Root } from "./rootModel";

export class DCL extends Root {
  constructor() {
    super();
    return throwError.invalidConstructorType();
  }
}
