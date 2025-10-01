import { pgConnect } from "./pgHelper";

export const initPgQueryBuilder = (params: {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}) => {
  pgConnect.connection = params;
};
