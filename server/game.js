// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const { actionTypes, tileTypes, serverPhases, winds } = require('./constants');

// Array of numbers from 0 to 135
const fourPlayersTiles = [...Array(136).keys()];
const threePlayersTiles = [] // Currently unavailable

function Group({ type, tiles }) {
  this.type = type;
  this.tiles = tiles;
}

function Player({ name, isBot, seatWind }) {
  this.name = name;
  this.isBot = isBot;

  this.seatWind = seatWind;
  this.drawnTile = null;
  this.hand = [];
  this.openGroups = []; // Array of: groups: type, tiles
  this.discardPile = [];

  this.score = 0;
}

function Option({ type, seatWind, data }) {
  this.type = type;
  this.seatWind = seatWind;
  this.data = data;
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
    this.playersData = Array(maxPlayers);

    this.phase = serverPhases.INITIALIZING_ROUND;

    // Store the options to be sent per modification to the Game object
    // Array of Arrays of: options: type, seatWind, data
    // Start from EAST
    this.optionsBuffer = Array(maxPlayers).fill([]);

    // Prioritized queues for the waiting incoming call actions
    this.callOptionWaitlist = {
      // Start from EAST
      // Array of options: type, seatWind, data
      primary: Array(maxPlayers), // RON
      secondary: Array(maxPlayers), // PON or KAN_OPEN_CALL
      tertiary: Array(maxPlayers) // CHII
    }

  }


  // Main action handler, store the options to be sent
  transform(action) {
    let { type, seatWind, data } = action;
    switch (type) {
      case actionTypes.ACTION_DISCARD: {
        break;
      }

      case actionTypes.ACTION_KAN_CLOSED: {
        break;
      }

      case actionTypes.ACTION_KAN_OPEN_DRAW: {
        break;
      }

      case actionTypes.ACTION_RIICHI: {
        break;
      }

      case actionTypes.ACTION_TSUMO: {
        break;
      }

      case actionTypes.ACTION_CHII: {
        break;
      }

      case actionTypes.ACTION_PON: {
        break;
      }

      case actionTypes.ACTION_KAN_OPEN_CALL: {
        break;
      }

      case actionTypes.ACTION_RON: {
        break;
      }
    }
  }


  // Main option generator units
  generateOption(type, seatWind, triggerTile) {
    let { hand, openGroups, discardPile } = this.playersData[seatWind];
    switch (type) {
      case actionTypes.OPTION_DISCARD: {
        return null;
      }

      case actionTypes.OPTION_KAN_CLOSED: {
        return null;
      }

      case actionTypes.OPTION_KAN_OPEN_DRAW: {
        break;
      }

      case actionTypes.OPTION_RIICHI: {
        return null;
      }

      case actionTypes.OPTION_TSUMO: {
        return null;
      }

      case actionTypes.OPTION_CHII: {
        return null;
      }

      case actionTypes.OPTION_PON: {

        return null;
      }

      case actionTypes.OPTION_KAN_OPEN_CALL: {
        return null;
      }

      case actionTypes.OPTION_RON: {
        return null;
      }
    }
  }


  // Main option generators
  generateDrawOptions(drawSeatWind, tile) {
    let optionTypes = [
      actionTypes.OPTION_KAN_CLOSED,
      actionTypes.OPTION_RIICHI,
      actionTypes.OPTION_TSUMO
    ];
    return optionTypes.map(type =>
      this.generateOption(type, drawSeatWind, tile)
    ).filter(option => option !== null);
  }

  generateCallOptions(discardSeatWind, tile) {

  }


  // Bot move generators
  generateBotDrawAction(seatWind) {

  }

  generateBotCallAction(seatWind) {

  }


  // Basic operations
  drawLiveWall(seatWind) {
    // Assume liveWall is not []
    let tile = this.roundData.liveWall.shift();
    this.playersData[seatWind].drawnTile = tile;
    return tile;
  }

  drawDeadWall(seatWind) {

  }

  discard(seatWind, tile) {

  }


  // Phase changer
  changePhase(nextPhase) {
    let prevPhase = this.phase;
    this.phase = nextPhase;
    console.log(`Server phase change ${prevPhase} -> ${nextPhase}`);
  }

  // Info message generator
  getGameboardInfo() {
    // TODO: More on this later
    return this;
  }

  // Option message generator
  getOptionsBuffer() {
    return this.optionsBuffer;
  }


  // Game lifecycle functions
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
    // Set phase
    this.changePhase(serverPhases.INITIALIZING_ROUND);

    let shuffledTiles;

    // This is compatible only to 4p now
    if (this.config.maxPlayers === 4) {
      // Reset the walls
      shuffledTiles = shuffle(fourPlayersTiles);
      this.roundData.liveWall = shuffledTiles.slice(52, 122);
      this.roundData.deadWall = shuffledTiles.slice(122, 136);
    } else if (this.config.maxPlayers === 3) {
      throw new Error('Error: 3-player currently unavailable');
    } else {
      throw new Error('Error: unavailble number of players');
    }

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

    // Reset optionsBuffer
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);

    // Resolve first turn's options
    let turnCounter = this.roundData.turnCounter;
    let drawnTile = this.drawLiveWall(turnCounter);
    this.optionBuffer[turnCounter] = this.generateDrawOptions(
      turnCounter, drawnTile);

    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
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