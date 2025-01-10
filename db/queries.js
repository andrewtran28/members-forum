const pool = require("./pool");

const getAllMessages = async () => {};

const addUser = async (username, firstName, lastName, password, passphrase) => {
  if (passphrase == "super") {
    await pool.query(
      "INSERT INTO users (username, first_name, last_name, password, super_member) VALUES ($1, $2, $3, $4, $5)",
      [username, firstName, lastName, password, "TRUE"]
    );
  } else {
    await pool.query(
      "INSERT INTO users (username, first_name, last_name, password, super_member) VALUES ($1, $2, $3, $4, $5)",
      [username, firstName, lastName, password, "FALSE"]
    );
  }
};

const getUserByUsername = async (username) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE username = $1 LIMIT 1;`,
    [username]
  );
  return rows;
};

const getUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE username = $1 LIMIT 1;`,
    [id]
  );
  return rows;
};

module.exports = {
  addUser,
  getUserByUsername,
  getUserById,
};
