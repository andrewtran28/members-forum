#! /usr/bin/env node

require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const HASHED_PASSWORD = bcrypt.hashSync(process.env.USER_PASSWORD, 5);

const dropTables = `
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS messages CASCADE;
`;

const createUsersTable = `
  CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR (50) UNIQUE NOT NULL,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL, 
    password VARCHAR (100) NOT NULL,
    super_member BOOLEAN DEFAULT FALSE
  );
`;

const createMessagesTable = `
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

const insertUsers = `
  INSERT INTO users (username, first_name, last_name, password, super_member)
  VALUES 
    ('minglee', 'Andrew', 'Tran', $1, TRUE),
    ('Palechub', 'Pale', 'Chub', $1, FALSE);
`;

const insertMessages = `
  INSERT INTO messages (user_id, subject, message, timestamp)
  VALUES
    (1, 'About the Super Messages Project', 
      'This web application allows members to post public messages, only seen by other members. If you are reading this, you already are a member and have successfully logged in!', 
      '2025-01-12 14:27:13.489906'),
    (1, 'About Members and Super Members', 
      'Members can view all messages by users and delete their own posts. Super Members can delete (almost) ALL messages by anyone and see the author''s full name. To become a Super Member, visit your account page at the top and enter the Super passphrase: ''super''. Note: This would typically be a secret but is disclosed for app demonstration purposes.', 
      '2025-01-12 14:32:44.931385'),
    (1, 'Important Notes About This Project', 
      'Messages are seen by ALL members...please keep messages respectful. In addition, although all passwords are encrypted, please refrain from inputting personal credentials. Thank you!', 
      '2025-01-13 11:52:15.132283'),
    (2, 'Hello World!', 
      'My name is Pale, and this is a message from a regular member!', 
      '2025-01-13 13:02:13.563270');
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  await client.query(dropTables);
  await client.query(createUsersTable);
  await client.query(createMessagesTable);
  await client.query(insertUsers, [HASHED_PASSWORD]);
  await client.query(insertMessages);
  await client.end();
}
 
main();
