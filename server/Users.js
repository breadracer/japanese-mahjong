// TODO: Make this the interface to the database

// Data structure of a user: token, ...data
let users = {};

// TODO: Change these functions to interact with database
module.exports.hasUser = username => users.hasOwnProperty(username);

module.exports.getUserToken = username =>
  users[username] ? users[username].token : null;

// Users.getUserData(username[,field])
// if no field is specified, return all the data
module.exports.getUserData = (username, field) =>
  !users[username] ? null : field ? users[username] : users[username][field];

module.exports.createUser = (username, token, data = {}) => {
  users[username] = { token, data };
};