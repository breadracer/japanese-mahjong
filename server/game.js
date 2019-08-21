// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const {
  actionTypes, tileTypes, serverPhases, optionStatus, winds
} = require('./constants');

// Array of numbers from 0 to 135
const fourPlayersTiles = [...Array(136).keys()];
const threePlayersTiles = [] // Currently unavailable

function Group(type, tiles) {
  this.type = type;
  this.tiles = tiles;
}

function Player({ name, isBot, seatWind }) {
  this.name = name;
  this.isBot = isBot;

  this.seatWind = seatWind;

  this.drawnTile = null;
  this.forbiddenTiles = []; // Disable call swapping (Kuikae)

  this.hand = []; // Sorted
  // NOTE: openGroups array is ordered by the time of formation
  this.openGroups = []; // Array of: groups: type, tiles
  this.discardPile = [];

  this.score = 0;
}

function Option(type, seatWind, data) {
  this.type = type;
  this.seatWind = seatWind;
  this.data = data;

  // Only used in call options
  this.status = optionStatus.PENDING;
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

      // Server-side only
      endFlag: false // Indicate the end of the whole game
    };
    this.roundData = {
      // One-round data
      liveWall: [], // length: 122 (4p)
      deadWall: [], // length: 14 (4p)
      kanCounter: 0, // Indicator for doras and the position of haiteihai
      turnCounter: 0,  // Indicator for the next moving player, start from EAST
      callTriggerTile: null, // Most recent discard or draw-time-kan tile

      // Server-side only
      nextRoundTurnFlag: false // Indicate the end of the round-turn
    }
    // From EAST to NORTH (or WEST)
    this.playersData = Array(maxPlayers);

    this.phase = serverPhases.INITIALIZING_TURN;

    // Store the options to be sent per modification to the Game object
    // Array of Arrays of: options: type, seatWind, data, status
    // Start from EAST
    this.optionsBuffer = Array(maxPlayers).fill([]);

    // Prioritized queues for the waiting incoming call actions
    // 0: RON, 1: PON or KAN_OPEN_CALL, 2: CHII
    // Each priority list start from EAST
    // NOTE: Each player has at most one call option of the same
    // priority at once
    // Array of arrays of options: type, seatWind, data, status
    this.callOptionWaitlist = Array(3).fill(Array(maxPlayers));

  }


  // Main action handler, store the options to be sent
  transform(action) {
    this.changePhase(serverPhases.PROCESSING_ACTION);
    let { type, seatWind, data } = action;
    switch (type) {
      // data: tile
      case actionTypes.ACTION_DISCARD: {
        this.discard(seatWind, data.tile);

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
      // DRAW OPTIONS
      // data: forbiddenTiles: []
      case actionTypes.OPTION_DISCARD: {
        return new Option(type, seatWind, {
          forbiddenTiles: this.playersData[seatWind].forbiddenTiles
        });
      }

      // data: candidateTiles Array of arrays: [] (3 tiles)
      case actionTypes.OPTION_KAN_CLOSED: {
        return null;
      }

      // data: candidateGroupIndex
      // (the index of the group in player's openGroups array)
      case actionTypes.OPTION_KAN_OPEN_DRAW: {
        return null;
      }

      // TODO: Design data format later
      case actionTypes.OPTION_RIICHI: {
        return null;
      }

      // TODO: Design data format later
      case actionTypes.OPTION_TSUMO: {
        return null;
      }


      // CALL OPTIONS
      // data: candidateTiles Array of arrays: [] (2 tiles)
      case actionTypes.OPTION_CHII: {
        return null;
      }

      // data: candidateTiles Array of arrays: [] (2 tiles)
      case actionTypes.OPTION_PON: {
        return null;
      }

      // data: candidateTiles Array of arrays: [] (3 tiles)
      case actionTypes.OPTION_KAN_OPEN_CALL: {
        return null;
      }

      // TODO: Design data format later
      case actionTypes.OPTION_RON: {
        return null;
      }
    }
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
    let player = this.playersData[seatWind];
    // If the tile is not the just drawn tile, update the hand
    // Otherwise, the hand is not changed
    if (player.drawnTile !== tile) {
      player.hand.splice(player.hand.indexOf(tile), 1);
      player.hand.push(player.drawnTile);
      player.hand.sort(tileCompare);
    }
    player.discardPile.push(tile);
    this.roundData.callTriggerTile = tile;

    // Update optionsBuffer
    this.optionsBuffer = this.generateCallOptions(seatWind);

    // If there is no call option generated
    if (this.optionsBuffer.every(playerOptions =>
      playerOptions.length === 0)) {
      // If this is the last discard and there is no call option 
      // generated, end the current turn
      if (this.roundData.liveWall.length === 0) {
        // TODO: Configure player score changes here

        this.endRoundTurn();

        // Otherwise, move to the next player's draw time
      } else {
        this.roundData.turnCounter++;
        this.roundData.turnCounter %= this.config.maxPlayers;
        let turnCounter = this.roundData.turnCounter;
        let drawnTile = this.drawLiveWall(turnCounter);
        // Update optionsBuffer
        this.optionsBuffer[turnCounter] = this.generateDrawOptions(
          turnCounter, drawnTile);

        // Set phase
        this.changePhase(serverPhases.WAITING_DRAW_ACTION);
      }

      // If there are call options generated
    } else {
      // Fill the callOptionWaitlist
      let callOptions = this.optionsBuffer.reduce((acc, val) =>
        acc.concat(val), []);
      callOptions.forEach(option => {
        switch (option.type) {
          case actionTypes.OPTION_RON: {
            this.callOptionWaitlist[0][option.seatWind] = option;
            break;
          }
          case actionTypes.OPTION_PON:
          case actionTypes.OPTION_KAN_OPEN_CALL: {
            this.callOptionWaitlist[1][option.seatWind] = option;
            break;
          }
          case actionTypes.OPTION_CHII: {
            this.callOptionWaitlist[2][option.seatWind] = option;
            break;
          }
        }
      });
      // Set phase
      this.changePhase(serverPhases.WAITING_CALL_ACTION);
    }

  }


  // Call option priority management
  shouldTransformActionGroup() {
    // Idea: For every received user or bot call action, this function should be
    // called to determine if it is the time to transform the game based on
    // current callOptionWaitlist status

    // TODO: The following code is wrong
    let flag = true;
    // If there is any option with priority greater than or equal to the request
    // priority that is ACCEPTED or PENDING, return false
    for (let i = 2; i >= 0; i--) {
      if (this.callOptionWaitlist[i].some(playerOption =>
        playerOption && playerOption.status !== optionStatus.REJECTED)) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  transformActionGroup() { }


  // Bot move generators
  performBotDrawAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
    let drawOptions = this.optionsBuffer[seatWind];
    let { hand } = this.playersData[seatWind];

    // STUPID bots will perform any options they have, prioritizing TSUMO,
    // RIICHI over KANs over DISCARD, choices between tile groups and discarding
    // tiles are performed randomly
    if (drawOptions.some(option =>
      option.type === actionTypes.OPTION_TSUMO)) {

    } else if (drawOptions.some(option =>
      option.type === actionTypes.OPTION_RIICHI)) {

    } else if (drawOptions.some(option =>
      option.type === actionTypes.OPTION_KAN_CLOSED)) {

    } else if (drawOptions.some(option =>
      option.type === actionTypes.OPTION_KAN_OPEN_DRAW)) {

    } else if (drawOptions.some(option =>
      option.type === actionTypes.OPTION_DISCARD)) {
      let randIndex = Math.floor(Math.random() * hand.length);
      this.discard(seatWind, hand[randIndex]);
    }
  }

  generateBotCallAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
    let callOptions = this.optionsBuffer[seatWind];
    let { hand } = this.playersData[seatWind];

    // STUPID bots will perform any options they have, prioritizing from RON,
    // KAN_OPEN_CALL, PON, to CHII, choices between tile groups are random

    // For each of the following branch:
    // First, decide accept or reject, update the option
    // Then, decide whether transform based on info of the waitlist

    // NOTE: Here assume the call options have been filled in the waitlist
    // inside routines like discard() or when handling other draw actions
    if (callOptions.some(option =>
      option.type === actionTypes.OPTION_RON)) {

    } else if (callOptions.some(option =>
      option.type === actionTypes.OPTION_KAN_OPEN_CALL)) {

    } else if (callOptions.some(option =>
      option.type === actionTypes.OPTION_PON)) {
      // Accept here
      option.status = optionStatus.ACCEPTED;

    } else if (callOptions.some(option =>
      option.type === actionTypes.OPTION_CHII)) {

    }
  }


  // Main option generators
  generateDrawOptions(drawSeatWind, tile) {
    let optionTypes = [
      actionTypes.OPTION_DISCARD,
      actionTypes.OPTION_KAN_OPEN_DRAW,
      actionTypes.OPTION_KAN_CLOSED,
      actionTypes.OPTION_RIICHI,
      actionTypes.OPTION_TSUMO
    ];
    return optionTypes.map(type =>
      this.generateOption(type, drawSeatWind, tile)
    ).filter(option => option !== null);
  }

  generateCallOptions(discardSeatWind) {
    let optionTypes = [
      actionTypes.OPTION_CHII,
      actionTypes.OPTION_PON,
      actionTypes.OPTION_KAN_OPEN_CALL,
      actionTypes.OPTION_RON,
    ];
    return Object.values(winds).map(seatWind =>
      seatWind === discardSeatWind ? []
        : optionTypes.map(type => this.generateOption(type, seatWind,
          this.roundData.callTriggerTile)).filter(option => option !== null));
  }


  // Phase changer
  changePhase(nextPhase) {
    let prevPhase = this.phase;
    this.phase = nextPhase;
    console.log(`Server phase change ${prevPhase} -> ${nextPhase}`);
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
    this.startRoundTurn();
  }

  endRoundTurn() {
    this.roundData.nextRoundTurnFlag = true;
    // If this is the last turn of the last wind round, end the game
    if (this.globalData.roundWind === this.config.endRoundWind &&
      this.globalData.roundWindCounter === this.config.maxPlayers - 1) {
      this.globalData.endFlag = true;
    }
    this.changePhase(serverPhases.FINISHING_TURN);
  }

  startRoundTurn() {
    // Set phase
    this.changePhase(serverPhases.INITIALIZING_TURN);

    this.roundData.nextRoundTurnFlag = false;

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

    // If current wind round has reached the maximum # of players, move to
    // the next wind round. Otherwise, continue current wind round
    if (this.globalData.roundWindCounter >= this.config.maxPlayers - 1) {
      this.globalData.roundWind++;
      this.globalData.roundWindCounter = 0;
    } else {
      this.globalData.roundWindCounter++;
    }

    // Reset record values
    this.roundData.kanCounter = 0;
    this.roundData.turnCounter = winds.EAST;
    this.roundData.callTriggerTile = null;

    // Change players' moving sequence
    this.playersData.push(this.playersData.shift());

    // Reset player data
    this.playersData.forEach((player, index) => {
      player.seatWind = index;
      player.discardPile = [];
      player.openGroups = [];
      player.hand = shuffledTiles.slice(
        index * 13, (index + 1) * 13).sort(tileCompare);
    });

    // Resolve first turn's options and reset optionsBuffer
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    let turnCounter = this.roundData.turnCounter;
    let drawnTile = this.drawLiveWall(turnCounter);
    this.optionsBuffer[turnCounter] = this.generateDrawOptions(
      turnCounter, drawnTile);

    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }


  // Info message generator
  getGameboardInfo() {
    // TODO: More on this later
    return this;
  }

  // Getters
  getOptionsBuffer() { return this.optionsBuffer; }
  getPlayersData() { return this.playersData; }
  getTurnCounter() { return this.roundData.turnCounter; }
  shouldEndRoundTurn() { return this.roundData.nextRoundTurnFlag; }
  shouldEndGame() { return this.globalData.endFlag; }

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

// Compare function of tiles
function tileCompare(x, y) {
  return x < y ? -1 : x > y ? 1 : 0;
}

module.exports = Game;