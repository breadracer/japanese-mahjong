// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const { actionTypes, tileTypes, serverPhases, winds } = require('./constants');

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

    } else {
      let randIndex = Math.floor(Math.random() * hand.length);
      this.discard(seatWind, hand[randIndex]);
    }
  }

  generateBotCallAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
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
       }
     }
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
    this.startRoundTurn();
  }

  endRoundTurn() {
    this.roundData.nextRoundTurnFlag = true;
    // If this is the last turn of the last wind round, end the game
    if (this.globalData.roundWind === this.config.endRoundWind &&
      this.globalData.roundWindCounter === this.config.maxPlayers - 1) {
      this.globalData.endFlag = true;
    }
  }

  startRoundTurn() {
    // Set phase
    this.changePhase(serverPhases.INITIALIZING_ROUND);

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