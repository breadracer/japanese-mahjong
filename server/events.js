const jwt = require('jsonwebtoken');
const url = require('url');

const { SECRET_KEY } = require('./contants');
const users = require('./users');
const gameWorld = require('./gameWorld')

module.exports.verifyClient = function (info, callback) {
  let { access_token, session_user } = url.parse(info.req.url, true).query;
  let flag = false;

  // Check if the same user already connected somewhere else
  if (gameWorld.hasSession(session_user)) {
    console.log(`User ${session_user} already logged in, ` +
      'closing connection...');
    callback(false, 400, 'Bad Request');

    // Check if such user exists
  } else if (!users.hasUser(session_user)) {
    console.log(`Invalid username: ${session_user}, closing connection...`);
    callback(false, 400, 'Bad Request');
  } else {
    // Verify client token in param query
    let decode = {};
    try {
      decode = jwt.verify(access_token, SECRET_KEY);
    } catch (err) {
      console.log('Invalid token', err);
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

module.exports.connectionHandler = function (socket, req) {
  let username = url.parse(req.url, true).query.session_user;

  // Add session record
  console.log(`Connection to ${username} is established`);
  gameWorld.addSession(username, socket);
  console.log('Current sessions:',
    gameWorld.getAllSessions().map(s => s.username));

  // TODO: More on this later
  // Say hello to everyone!
  gameWorld.sendToAll('CHAT', `${username} is now online! Currently ` +
    `online: ${gameWorld.getAllSessions().map(s => s.username).join(', ')}`);
  ;

  socket.on('close', (_, reason) => {
    // Remove session record
    gameWorld.removeSession(username);
    console.log(`Connection to ${username} is closed`);
    console.log('Current sessions:',
      gameWorld.getAllSessions().map(s => s.username));

    // TODO: More on this later
    // Broadcast to everyone else
    gameWorld.sendToAll('CHAT', `${username} is now offline. Currently ` +
      `online: ${gameWorld.getAllSessions().map(s => s.username).join(', ')}`);
  });

  socket.on('pong', () => {
    gameWorld.getSessionByUsername(username).setIsAlive(true);
  });

  socket.on('message', msg => {
    // TODO: More on this later
    // Broadcast to everyone
    gameWorld.sendToAll('CHAT', `${username} <${Date()}>: ${msg}`);
  });
}

module.exports.heartbeat = function () {
  gameWorld.getAllSessions().forEach(s => {
    if (!s.getIsAlive()) {
      console.log(`Ping times out, connection ` +
        `to ${s.username} is terminated`);
      s.terminateSocket();
    } else {
      s.setIsAlive(false);
      s.pingSocket();
      console.log(`Ping to ${s.username}`);
    }
  })
};