#! /usr/bin/env node

const { Client } = require("pg");
require("dotenv").config();

const resetDB = `
  DROP TABLE users CASCADE;
  DROP TABLE messages CASCADE;

  CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL, 
    username VARCHAR (50) UNIQUE NOT NULL,
    password VARCHAR (50) NOT NULL,
  );

  CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY, 
    user_id INT NOT NULL,
    subject VARCHAR (255),
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id)
      ON DELETE CASCADE
  );
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  await client.query(resetDB);
  await client.query(populateDB);
  await client.end();
}

main();
