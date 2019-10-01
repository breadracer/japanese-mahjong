// TODO: Record more data later
// Table schema: username, token, register_time

const { Pool } = require('pg');

const database = process.env.MAHJONG_DATABASE;
const table = process.env.MAHJONG_TABLE;
const password = process.env.MAHJONG_PASSWORD;

const pool = new Pool({ database, password });

pool.on('error', err => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function executeQuery(queryString, params) {
  const client = await pool.connect();
  let result;
  try {
    result = await client.query(queryString, params);
  } catch (err) {
    client.release();
    console.error(err.stack);
  } finally {
    client.release();
  }
  return result;
}

// TODO: Change these functions to interact with database
module.exports.hasUser = async username => {
  let query = `SELECT username FROM ${table} WHERE EXISTS (SELECT 1 FROM ${
    table} WHERE username = $1)`;
  let result = await executeQuery(query, [username]);
  return result.rows.length !== 0;
}

module.exports.getUserToken = async username => {
  let query = `SELECT token FROM ${table} WHERE username = $1`;
  let result = await executeQuery(query, [username]);
  return result.rows.length !== 0 ? result.rows[0].token : null;
}

// TODO:
// Users.getUserData(username[,field])
// if no field is specified, return all the data
// module.exports.getUserData = (username, field) =>
//   !users[username] ? null : field ? users[username] : users[username][field];

module.exports.createUser = async (username, token) => {
  let query = `INSERT INTO ${table} (username, token, \
    register_time) VALUES ($1, $2, $3)`;
  await executeQuery(query, [username, token, new Date()]);
};