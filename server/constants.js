module.exports.constants = {
  SECRET_KEY: process.env.MAHJONG_SECRET_KEY,
  HOST_NAME: process.env.MAHJONG_HOST_NAME,
};

module.exports.winds = { EAST: 0, SOUTH: 1, WEST: 2, NORTH: 3 };

module.exports.serverPhases = {
  INITIALIZING_TURN: 'INITIALIZING_TURN',
  WAITING_CALL_ACTION: 'WAITING_CALL_ACTION',
  WAITING_DRAW_ACTION: 'WAITING_DRAW_ACTION',
  PROCESSING_ACTION: 'PROCESSING_ACTION',
  FINISHING_TURN: 'FINISHING_TURN',
  // TODO: More on this later
}

module.exports.botTypes = {
  STUPID: 'Idiot',
  EASY: 'Random Guy',
  HARD: 'Saki',
  // TODO: More types later
};

module.exports.optionStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

module.exports.actionTypes = {
  OPTION_CHII: 'OPTION_CHII',
  OPTION_PON: 'OPTION_PON',
  OPTION_KAN_OPEN_CALL: 'OPTION_KAN_OPEN_CALL',
  OPTION_RON: 'OPTION_RON',

  OPTION_DISCARD: 'OPTION_DISCARD',
  OPTION_KAN_CLOSED: 'OPTION_KAN_CLOSED',
  OPTION_KAN_OPEN_DRAW: 'OPTION_KAN_OPEN_DRAW',
  OPTION_RIICHI: 'OPTION_RIICHI',
  OPTION_TSUMO: 'OPTION_TSUMO',

  ACTION_CHII: 'ACTION_CHII',
  ACTION_PON: 'ACTION_PON',
  ACTION_KAN_OPEN_CALL: 'ACTION_KAN_OPEN_CALL',
  ACTION_RON: 'ACTION_RON',

  ACTION_DISCARD: 'ACTION_DISCARD',
  ACTION_KAN_CLOSED: 'ACTION_KAN_CLOSED',
  ACTION_KAN_OPEN_DRAW: 'ACTION_KAN_OPEN_DRAW',
  ACTION_RIICHI: 'ACTION_RIICHI',
  ACTION_TSUMO: 'ACTION_TSUMO',

  // Three-player-game's unique action currently not available
};

module.exports.tileTypes = {
  // Tile sets
  MANZU: 0, PINZU: 1, SOUZU: 2, JIHAI: 3,

  // Tiles
  MAN_1: 0, MAN_2: 1, MAN_3: 2,
  MAN_4: 3, MAN_5: 4, MAN_6: 5,
  MAN_7: 6, MAN_8: 7, MAN_9: 8,
  PIN_1: 9, PIN_2: 10, PIN_3: 11,
  PIN_4: 12, PIN_5: 13, PIN_6: 14,
  PIN_7: 15, PIN_8: 16, PIN_9: 17,
  SOU_1: 18, SOU_2: 19, SOU_3: 20,
  SOU_4: 21, SOU_5: 22, SOU_6: 23,
  SOU_7: 24, SOU_8: 25, SOU_9: 26,
  TON: 27, NAN: 28, SHAA: 29, PEI: 30,
  HAKU: 31, HATSU: 32, CHUN: 33,
  
  // These tile numbers are only used in special cases where the presence 
  // of the red-doras need to be treated differently from ordinary tiles
  RED_MAN_5: 36, RED_PIN_5: 37, RED_SOU_5: 38
};

module.exports.redDoraTileValues = {
  // NOTE: tile 16, 52, 53, 88 are red-doras
  // Tile numbers
  RED_MAN_5_1: 16, RED_PIN_5_1: 52,
  RED_PIN_5_2: 53, RED_SOU_5_1: 88
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
  // add or remove bots
  // start the mahjong game (for enough users)
  // exit the room (give the creater identity to others, if none, room deleted)
  PULL_ADD_BOT: 'PULL_ADD_BOT',
  PULL_REMOVE_BOT: 'PULL_REMOVE_BOT',
  PULL_START_GAME: 'PULL_START_GAME',

  // User (follower) in the Room may:
  // exit the room
  PULL_EXIT_ROOM: 'PULL_EXIT_ROOM',

  // All actions related to game playing
  PULL_UPDATE_GAME: 'PULL_UPDATE_GAME',


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
  // game
  PUSH_UPDATE_GAME: 'PUSH_UPDATE_GAME',

};