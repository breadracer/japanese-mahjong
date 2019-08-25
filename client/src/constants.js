export const constants = {
  HOST_NAME: process.env.REACT_APP_MAHJONG_HOST_NAME,
};

export const userStatus = {
  // User status
  OUT_ROOM: 'OUT_ROOM',
  IN_ROOM: 'IN_ROOM',
  IN_GAME: 'IN_GAME'
};

export const botTypes = {
  STUPID: 'Idiot',
  EASY: 'Random Guy',
  HARD: 'Saki',
  // TODO: More types later
};

export const actionTypes = {
  DRAW_OPTION: 0, CALL_OPTION: 1, DRAW_ACTION: 2, CALL_ACTION: 3,

  OPTION_DISCARD: 0,
  OPTION_KAN_OPEN_DRAW: 1,
  OPTION_KAN_CLOSED: 2,
  // Three-player-game's unique action currently not available
  OPTION_KITA: 3,
  OPTION_RIICHI: 4,
  OPTION_TSUMO: 5,

  OPTION_CHII: 10,
  OPTION_PON: 11,
  OPTION_KAN_OPEN_CALL: 12,
  OPTION_RON: 13,

  ACTION_DISCARD: 20,
  ACTION_KAN_OPEN_DRAW: 21,
  ACTION_KAN_CLOSED: 22,
  // Three-player-game's unique action currently not available
  ACTION_KITA: 23,
  ACTION_RIICHI: 24,
  ACTION_TSUMO: 25,

  ACTION_CHII: 30,
  ACTION_PON: 31,
  ACTION_KAN_OPEN_CALL: 32,
  ACTION_RON: 33,
};

export const tileTypes = {
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

export const messageTypes = {
  // Pull message types
  PULL_ALL_ROOMS: 'PULL_ALL_ROOMS',
  PULL_ALL_USERS: 'PULL_ALL_USERS',
  PULL_CREATE_ROOM: 'PULL_CREATE_ROOM',
  PULL_JOIN_ROOM: 'PULL_JOIN_ROOM',

  PULL_ADD_BOT: 'PULL_ADD_BOT',
  PULL_REMOVE_BOT: 'PULL_REMOVE_BOT',
  PULL_START_GAME: 'PULL_START_GAME',

  PULL_EXIT_ROOM: 'PULL_EXIT_ROOM',

  PULL_UPDATE_GAME: 'PULL_UPDATE_GAME',


  // Push message types
  PUSH_USER_CONNECT: 'PUSH_USER_CONNECT',
  PUSH_USER_DISCONNECT: 'PUSH_USER_DISCONNECT',

  PUSH_ALL_ROOMS: 'PUSH_ALL_ROOMS',
  PUSH_ALL_USERS: 'PUSH_ALL_USERS',
  PUSH_CREATE_ROOM: 'PUSH_CREATE_ROOM',
  PUSH_JOIN_ROOM: 'PUSH_JOIN_ROOM',

  PUSH_ADD_BOT: 'PUSH_ADD_BOT',
  PUSH_REMOVE_BOT: 'PUSH_REMOVE_BOT',
  PUSH_START_GAME: 'PUSH_START_GAME',

  PUSH_EXIT_ROOM: 'PUSH_EXIT_ROOM',

  PUSH_UPDATE_GAME: 'PUSH_UPDATE_GAME',

};