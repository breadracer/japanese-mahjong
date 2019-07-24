const jwt = require('jsonwebtoken');
const url = require('url');

const { SECRET_KEY } = require('./contants');

const sessions = require('./Sessions');
// TODO: Change this to be interface to the database
const Users = require('./Users');

// let users = {};
// let sessions = {};

module.exports.verifyClient = function(info, callback) {
  let { access_token, session_user } = url.parse(info.req.url, true).query;
  let flag = false;

  // Check if the same user already connected somewhere else
  if (sessions.hasOwnProperty(session_user)) {
    console.log(`User ${session_user} already logged in, ` +
      'closing connection...');
    callback(false, 400, 'Bad Request');

    // Check if such user exists
  } else if (!Users.hasUser(session_user)) {
    console.log(`Invalid username: ${session_user}, closing connection...`);
    callback(false, 400, 'Bad Request');
  } else {
    // Verify client token in param query
    let decode = {};
    try {
      decode = jwt.verify(access_token, SECRET_KEY);
    } catch (err) {
      console.log('Invalid token');
      callback(false, 401, 'Unauthorized');
    }

    // Check if the correct username is decoded
    if (decode.username === session_user) {
      flag = true;
    } else {
      console.log('Inconsistent request username');
      callback(false, 401, 'Unauthorized');
    }
  }

  if (flag) {
    console.log(`Passed verifyClient: ${session_user}`);
    callback(true);
  }
}

module.exports.connectionHandler = function(socket, req) {
  let username = url.parse(req.url, true).query.session_user;

  // Add session record
  console.log(`Connection to ${username} is established`);
  sessions[username] = { socket, isAlive: true };
  console.log('Current sessions:', Object.keys(sessions));

  // TODO: More on this later
  // Say hello to everyone!
  Object.entries(sessions).forEach(([_username, { socket: _socket }]) => {
    if (_username !== username)
      _socket.send(`${username} is now online! Currently online: ${
        Object.keys(sessions).join(', ')}`);
    else
      _socket.send(`Hello, ${username}! Currently online: ${
        Object.keys(sessions).join(', ')}`);
  });

  socket.on('close', (_, reason) => {
    // Remove session record
    sessions[username] = null;
    delete sessions[username];
    console.log(`Connection to ${username} is closed`);
    console.log('Current sessions:', Object.keys(sessions));

    // TODO: More on this later
    // Broadcast to everyone else
    Object.entries(sessions).forEach(([_username, { socket: _socket }]) => {
      if (_username !== username)
        _socket.send(`${username} is now offline. Currently online: ${
          Object.keys(sessions).join(', ')}`);
    });
  });

  socket.on('pong', () => { sessions[username].isAlive = true; });

  socket.on('message', msg => {
    // TODO: More on this later
    // Broadcast to everyone
    Object.entries(sessions).forEach(([_username, { socket: _socket }]) => {
      _socket.send(`${username} <${Date()}>: ${msg}`);
    });
  });
}

module.exports.heartbeat = function() {
  Object.entries(sessions).forEach(([username, { socket, isAlive }]) => {
    if (!isAlive) {
      console.log(`Ping times out, connection to ${username} is terminated`);
      socket.terminate();
    } else {
      sessions[username].isAlive = false;
      sessions[username].socket.ping(() => {});
    }
  });
}