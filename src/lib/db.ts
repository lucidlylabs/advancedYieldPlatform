import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);

export default pool;
