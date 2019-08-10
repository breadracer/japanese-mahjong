module.exports.constants = {
  SECRET_KEY: process.env.MAHJONG_SECRET_KEY,
  HOST_NAME: process.env.MAHJONG_HOST_NAME,
};

module.exports.winds = { EAST: 0, SOUTH: 1, WEST: 2, NORTH: 3 };

module.exports.actionTypes = {

};

module.exports.tileTypes = {
  // Tile sets
  SOUZU: 0, PINZU: 1, MANZU: 2, JIHAI: 3,

  // Tiles
  SOU_1: 0, SOU_2: 1, SOU_3: 2,
  SOU_4: 3, SOU_5: 4, SOU_6: 5,
  SOU_7: 6, SOU_8: 7, SOU_9: 8,
  PIN_1: 9, PIN_2: 10, PIN_3: 11,
  PIN_4: 12, PIN_5: 13, PIN_6: 14,
  PIN_7: 15, PIN_8: 16, PIN_9: 17,
  MAN_1: 18, MAN_2: 19, MAN_3: 20,
  MAN_4: 21, MAN_5: 22, MAN_6: 23,
  MAN_7: 24, MAN_8: 25, MAN_9: 26,
  TON: 27, NAN: 28, SHAA: 29, PEI: 30,
  HAKU: 31, HATSU: 32, CHUN: 33
};


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
  // add or remove bots
  // start the mahjong game (for enough users)
  // exit the room (give the creater identity to others, if none, room deleted)
  PULL_ADD_BOT: 'PULL_ADD_BOT',
  PULL_REMOVE_BOT: 'PULL_REMOVE_BOT',
  PULL_START_GAME: 'PULL_START_GAME',

  // User (follower) in the Room may:
  // exit the room
  PULL_EXIT_ROOM: 'PULL_EXIT_ROOM',


  // Push message types

  // Update online user list
  // newUser: username, roomname
  PUSH_USER_CONNECT: 'PUSH_USER_CONNECT',

  // Update online user list, if this user is in-room update online room list
  // removedUser: username, roomname
  // updatedRoom: usernames, owner
  PUSH_USER_DISCONNECT: 'PUSH_USER_DISCONNECT',

  // Re-generate online room list
  // onlineRooms[]: roomname, usernames, botnames, maxPlayers, isInGame, owner
  PUSH_ALL_ROOMS: 'PUSH_ALL_ROOMS',

  // Re-generate online user list
  // onlineUsers[]: username, roomname
  PUSH_ALL_USERS: 'PUSH_ALL_USERS',

  // Update online room list and user list
  // isValid;
  // newRoom: roomname, usernames, botnames, maxPlayers, isInGame, owner
  PUSH_CREATE_ROOM: 'PUSH_CREATE_ROOM',

  // Update online room list and user list
  // isValid; updatedUser: username, roomname;
  // updatedRoom: roomname, usernames, botnames, maxPlayers, isInGame, owner;
  PUSH_JOIN_ROOM: 'PUSH_JOIN_ROOM',

  PUSH_ADD_BOT: 'PUSH_ADD_BOT',
  PUSH_REMOVE_BOT: 'PUSH_REMOVE_BOT',

  // Update online room list
  // isValid; updatedRoom: roomname
  PUSH_START_GAME: 'PUSH_START_GAME',

  // Update online room list and user list
  // isValid; updatedUser: username;
  // updatedRoom: roomname, usernames, botnames, owner;
  PUSH_EXIT_ROOM: 'PUSH_EXIT_ROOM',


  // IN_GAME ONLY
  
  // Update room game data
  // gamedata
  PUSH_INIT_GAME: 'PUSH_INIT_GAME',

};