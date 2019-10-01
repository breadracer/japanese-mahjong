const jwt = require('jsonwebtoken');
const url = require('url');

const { constants, messageTypes } = require('./constants');
const users = require('./users');
const gameWorld = require('./gameWorld');

module.exports.verifyClient = async function (info, callback) {
  let { access_token, session_user } = url.parse(info.req.url, true).query;
  let flag = false;

  // Check if the same user already connected somewhere else
  if (gameWorld.hasSession(session_user)) {
    console.log(`User ${session_user} already logged in, ` +
      'closing connection...');
    callback(false, 400, 'Bad Request');

    // Check if such user exists
  } else if (!(await users.hasUser(session_user))) {
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
      roomname: null
    }
  }, session_user);

  // Send gameWorld information to the client
  gameWorld.sendToOne(messageTypes.PUSH_ALL_ROOMS,
    gameWorld.getOnlineRoomsMessage(), session_user);
  gameWorld.sendToOne(messageTypes.PUSH_ALL_USERS,
    gameWorld.getOnlineUsersMessage(), session_user);


  socket.on('pong', () => {
    gameWorld.getSessionByUsername(session_user).setIsAlive(true);
  });

  socket.on('message', async msg => {
    // TODO: Verify client token for each incoming message

    console.log(`Received ${msg} from ${session_user}`);
    try {
      await gameWorld.handleMessage(JSON.parse(msg), session_user);
    } catch (err) {
      console.error(err);
    }
    // Broadcast to everyone
    // gameWorld.sendToAll('CHAT', `${username} <${Date()}>: ${msg}`);
  });

  socket.on('close', (_, reason) => {
    // Delete the user session and possibly empty room on the server-side
    let room = gameWorld.getRoomByUsername(session_user);
    gameWorld.removeSession(session_user);

    // Notify all other users
    if (room) {
      // If user is inside a room, notify the client to delete the user and 
      // update room info
      gameWorld.sendToAllExcept(messageTypes.PUSH_USER_DISCONNECT, {
        removedUser: {
          username: session_user,
          roomname: room.roomname
        },
        updatedRoom: {
          usernames: room.usernames,
          owner: room.owner
        }
      }, session_user);
    } else {
      // If user is not in a room, just let the client delete the user
      gameWorld.sendToAllExcept(messageTypes.PUSH_USER_DISCONNECT, {
        removedUser: {
          username: session_user,
          roomname: null
        }
      }, session_user);
    }

    // If room is emtpy, remove that room
    if (room && room.isEmpty())
      gameWorld.removeRoom(room.roomname);

    console.log(`Connection to ${session_user} is closed`);
    console.log('Current sessions:',
      gameWorld.getAllSessions().map(s => s.username));
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
      // console.log(`Ping to ${s.username} at ${Date()}`);
    }
  })
};