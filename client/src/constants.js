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
  STUPID: 'STUPID',
  EASY: 'EASY',
  HARD: 'HARD',
  // TODO: More types later
};

export const actionTypes = {
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
  HAKU: 31, HATSU: 32, CHUN: 33
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