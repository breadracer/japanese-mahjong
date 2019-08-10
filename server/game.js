const { actionTypes, tileTypes, winds } = require('./constants');

// Array of numbers from 0 to 135
const tiles = [...Array(136).keys()];

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
      // One-round data
      liveWallBody: [],
      liveWallTail: [],
      deadWall: [],
      kanCounter: 0,
      turnCounter: -1,

      // Round counters
      roundWind: -1,
      roundNumTurn: 0,
    };
    this.players = [];
    this.phase = '';
  }

  startNewRound() {
    // Reset the walls
    let shuffledTiles = shuffle(tiles);
    this.stats.liveWallBody = shuffledTiles.slice(0, 118);
    this.stats.liveWallTail = shuffledTiles.slice(118, 122);
    this.stats.deadWall = shuffledTiles.slice(122, 136);
    // TODO: Reset other properties
  }



  init() {

  }

  transform() {

  }

}

// Fisher-Yates Shuffle
function shuffle(arr) {
  let newArr = [...arr];
  let currIndex = newArr.length, tempVal, randIndex;
  while (currIndex !== 0) {
    randIndex = Math.floor(Math.random() * currIndex);
    currIndex--;
    tempVal = newArr[currIndex];
    newArr[currIndex] = newArr[randIndex];
    newArr[randIndex] = tempVal;
  }
  return newArr;
}

module.exports = Game;