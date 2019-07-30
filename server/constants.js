module.exports.constants = {
  SECRET_KEY: process.env.MAHJONG_SECRET_KEY,
  HOST_NAME: process.env.MAHJONG_HOST_NAME,
}

module.exports.messageTypes = {
  // Pull message types

  // User outside a room may:
  // Get all room/online user information
  // Join a room
  // Create a room w/ room name
  PULL_ALL_ROOMS: 'PULL_ALL_ROOMS',
  PULL_ALL_USERS: 'PULL_ALL_USERS',
  PULL_CREATE_ROOM: 'PULL_CREATE_ROOM',
  PULL_JOIN_ROOM: 'PULL_JOIN_ROOM',

  // User (creater) in the Room may:
  // chat
  // start the mahjong game (for enough users)
  // exit the room (give the creater identity to others, if none, room deleted)
  PULL_START_GAME: 'PULL_START_GAME',

  // User (follower) in the Room may:
  // chat
  // exit the room
  PULL_EXIT_ROOM: 'PULL_EXIT_ROOM',
  PULL_CHAT_MESSAGE: 'PULL_CHAT_MESSAGE',


  // Push message types

  // User session related:
  PUSH_USER_CONNECT: 'PUSH_USER_CONNECT',
  PUSH_USER_DISCONNECT: 'PUSH_USER_DISCONNECT',

  PUSH_ALL_ROOMS: 'PUSH_ALL_ROOMS',
  PUSH_ALL_USERS: 'PUSH_ALL_USERS',
  PUSH_CREATE_ROOM: 'PUSH_CREATE_ROOM',
  PUSH_JOIN_ROOM: 'PUSH_JOIN_ROOM',

  PUSH_START_GAME: 'PUSH_START_GAME',

  PUSH_EXIT_ROOM: 'PUSH_EXIT_ROOM',
  PUSH_CHAT_MESSAGE: 'PUSH_CHAT_MESSAGE',



};