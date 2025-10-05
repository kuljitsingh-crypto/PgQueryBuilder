const INTERNAL_CB_CTX = Symbol("internal-callbacl-ctx");

export const isValidInternalContext = (ctx: symbol) =>
  typeof ctx === "symbol" && INTERNAL_CB_CTX === ctx;
export const getInternalContext = () => INTERNAL_CB_CTX;
