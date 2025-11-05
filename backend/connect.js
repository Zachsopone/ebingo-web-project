import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

let caCert;
try {
  // Get the path from .env and read the file
  caCert = fs.readFileSync(process.env.CA);
} catch (err) {
  console.error("FAILED TO READ ca.pem FILE:", err.message);
  console.error("Check the certificate in your .env file. Path:", process.env.CA);
  process.exit(1);
}


export const db = mysql.createPool({

  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.PORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  ssl_mode: process.env.SSL,
  ssl: {
    ca: caCert
  },
});

console.log("Connected to MySQL");