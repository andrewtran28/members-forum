#! /usr/bin/env node

require("dotenv").config();
const { Client } = require("pg");

const sql = `
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS messages CASCADE;

  CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR (50) UNIQUE NOT NULL,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL, 
    password VARCHAR (100) NOT NULL,
    super_member BOOLEAN DEFAULT FALSE
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

  INSERT INTO users (username, first_name, last_name, password, super_member)
    VALUES ('minglee', 'Andrew', 'Tran', 'mingpass123', TRUE);

  INSERT INTO users (username, first_name, last_name, password, super_member)
    VALUES ('Palechub', 'Pale', 'Chub', 'palepass123', FALSE);
  
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  await client.query(sql);
  await client.end();
}

main();
