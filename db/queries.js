require("dotenv").config();
const pool = require("./pool");

const addUser = async (username, firstName, lastName, password, passphrase) => {
  if (passphrase == process.env.SUPER_PASSPHRASE) {
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
  const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1`, [
    username,
  ]);

  return rows[0];
};

const getUserById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE user_id = $1;`, [
    id,
  ]);
  return rows[0];
};

const updateUser = async (status, id) => {
  await pool.query(`UPDATE users SET super_member = $1 WHERE user_id = $2;`, [status, id]);
}

const deleteUser = async (user_id) => {
  try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM messages WHERE user_id = $1', [user_id]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting user and messages:', error);
  }
}

const getAllMessages = async () => {
  const { rows } = await pool.query(`
    SELECT messages.message_id, 
      users.username, 
      users.user_id,
      users.first_name,
      users.last_name,
      messages.subject, 
      messages.message, 
      messages.timestamp
    FROM 
      messages
    JOIN 
      users
    ON 
      messages.user_id = users.user_id
    ORDER BY 
      messages.timestamp DESC;
  `);

  return rows;
};

const addMessage = async (userId, subject, message) => {
  await pool.query(
    `
    INSERT INTO messages (user_id, subject, message, timestamp)
    VALUES ($1, $2, $3, NOW())
    RETURNING message_id;
  `,
    [userId, subject, message]
  );
};

const deleteMessageById = async (message_id) => {
  await pool.query(`
    DELETE FROM messages WHERE message_id = $1;
  `, [message_id])
}

module.exports = {
  addUser,
  getUserByUsername,
  getUserById,
  updateUser,
  deleteUser,
  getAllMessages,
  addMessage,
  deleteMessageById
};
