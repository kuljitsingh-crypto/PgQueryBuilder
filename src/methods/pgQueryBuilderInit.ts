import { pgConnect } from "./pgHelper";

export const initializePgQueryBuilder = (params: {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}) => {
  pgConnect.connection = params;
};
