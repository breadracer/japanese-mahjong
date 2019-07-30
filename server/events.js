const jwt = require('jsonwebtoken');
const url = require('url');

const { constants, messageTypes } = require('./constants');
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
      decode = jwt.verify(access_token, constants.SECRET_KEY);
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
  let session_user = url.parse(req.url, true).query.session_user;

  // Add session record
  console.log(`Connection to ${session_user} is established`);
  gameWorld.addSession(session_user, socket);
  console.log('Current sessions:',
    gameWorld.getAllSessions().map(s => s.username));

  // Notify all other users
  gameWorld.sendToAllExcept(messageTypes.PUSH_USER_CONNECT, {
    newUser: {
      username: session_user,
      isInRoom: false
    }
  }, session_user);

  // Send gameWorld information to the client
  gameWorld.sendToOne(messageTypes.PUSH_ALL_ROOMS, {
    onlineRooms: gameWorld.getAllRooms().map(r => ({
      roomname: r.roomname,
      numPlayers: r.usernames.length,
      maxPlayers: r.maxPlayers,
      isInGame: r.game !== null,
      owner: r.owner
    }))
  }, session_user);
  gameWorld.sendToOne(messageTypes.PUSH_ALL_USERS, {
    onlineUsers: gameWorld.getAllSessions().map(s => ({
      username: s.username,
      isInRoom: s.roomname !== null
    }))
  }, session_user);

  socket.on('close', (_, reason) => {
    // Remove session record
    gameWorld.removeSession(session_user);
    console.log(`Connection to ${session_user} is closed`);
    console.log('Current sessions:',
      gameWorld.getAllSessions().map(s => s.username));

    // Notify all other users
    gameWorld.sendToAllExcept(messageTypes.PUSH_USER_DISCONNECT, {
      removedUser: { username: session_user }}, session_user);
  });

  socket.on('pong', () => {
    gameWorld.getSessionByUsername(session_user).setIsAlive(true);
  });

  socket.on('message', msg => {
    // TODO: Verify client token for each incoming message

    // TODO: More on this later
    console.log(`Received ${msg} from ${session_user}`);
    gameWorld.handleMessage(JSON.parse(msg));
    // Broadcast to everyone
    // gameWorld.sendToAll('CHAT', `${username} <${Date()}>: ${msg}`);
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
      console.log(`Ping to ${s.username} at ${Date()}`);
    }
  })
};