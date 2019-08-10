const { actionTypes, tileTypes, winds } = require('./constants');

class Player {
  constructor({ username, isBot }) {
    this.username = username;
    this.isBot = isBot;
    this.hands = [];
    this.score = 0;
    this.seatWind = -1;
    this.discardPile = [];
  }
}


class Game {
  constructor({ roomname, maxPlayers }) {
    this.config = { roomname, maxPlayers };
    this.stats = {
      liveWallBody: [],
      liveWallTail: [],
      deadWall: [],
      roundWind: -1,
      kanCounter: 0,
    };
    this.players = [];
    this.status = '';
    this.turnCounter = -1
  }

  init() {

  }

  transform() {

  }

}

module.exports = Game;