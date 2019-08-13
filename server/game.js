// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const { actionTypes, tileTypes, winds } = require('./constants');

// Array of numbers from 0 to 135
const fourPlayersTiles = [...Array(136).keys()];
const threePlayersTiles = [] // Currently unavailable

class Player {
  constructor({ name, isBot, seatWind }) {
    this.name = name;
    this.isBot = isBot;

    this.seatWind = seatWind;
    this.hand = [];
    this.openGroups = []; // Array of: groups: type, tiles
    this.discardPile = [];

    this.score = 0;
  }

}

class Game {
  constructor({ maxPlayers, endRoundWind, usernames, botnames }) {
    this.config = {
      maxPlayers,
      endRoundWind, // Number
      usernames, // Array of username (String)
      botnames // Array of botname (String)
    };
    this.globalData = {
      // Round counters
      roundWind: 0,
      roundWindCounter: 0, // Start from 0, index for the EAST player (1st move)
    };
    this.roundData = {
      // One-round data
      liveWall: [], // length: 122 (4p)
      deadWall: [], // length: 14 (4p)
      kanCounter: 0, // Indicator for doras and the position of haiteihai
      turnCounter: 0,  // Indicator for the next moving player, start from EAST
    }
    // From EAST to NORTH (or WEST)
    this.playersData = [];
    this.phase = '';
  }

  // Main action handler
  transform(action) {
    let { type, data } = action;
    switch(type) {
      
    }
  }

  init() {
    // Setup initial player sequence
    let counter = 0;
    let shuffledIndexes = shuffle([...Array(this.config.maxPlayers).keys()]);
    this.config.usernames.forEach(username => {
      this.playersData[shuffledIndexes[counter]] = new Player({
        name: username, isBot: false, seatWind: shuffledIndexes[counter]
      });
      counter++;
    });
    this.config.botnames.forEach(botname => {
      this.playersData[shuffledIndexes[counter]] = new Player({
        name: botname, isBot: true, seatWind: shuffledIndexes[counter]
      });
      counter++;
    });
    this.startNewRound();
  }

  startNewRound() {
    // Reset the walls
    let shuffledTiles = shuffle(fourPlayersTiles);

    // This is compatible only to 4p now
    this.roundData.liveWall = shuffledTiles.slice(52, 122);
    this.roundData.deadWall = shuffledTiles.slice(122, 136);

    // Reset kan counter
    this.roundData.kanCounter = 0;

    // If current wind round has reached the maximum # of players, move to
    // the next wind round. Otherwise, continue current wind round
    if (this.globalData.roundWindCounter >= this.config.maxPlayers - 1) {
      this.globalData.roundWind++;
      this.globalData.roundWindCounter = 0;
    } else {
      this.globalData.roundWindCounter++;
    }

    // Reset the start turn index to EAST
    this.roundData.turnCounter = winds.EAST;

    // Change players' moving sequence
    this.playersData.push(this.playersData.shift());

    // Reset player data
    this.playersData.forEach((player, index) => {
      player.seatWind = index;
      player.discardPile = [];
      player.openGroups = [];
      player.hand = shuffledTiles.slice(index * 13, (index + 1) * 13);
    });

    // TODO: Reset phase
  }

  // State message generator
  getGameStateMessage() {
    // TODO: More on this later
    return this;
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