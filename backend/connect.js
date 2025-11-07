import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();


let caCert;
try {
  caCert = process.env.CA;
} catch (err) {
  console.error("FAILED TO READ CA CERTIFICATE FILE:", err.message);
  process.exit(1);
}


export const db = mysql.createPool({

  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.PORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  ssl: {
    ca: caCert
  },
});

console.log("Connected to MySQL");