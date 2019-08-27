// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const {
  actionTypes, tileTypes, redDoraTileValues,
  serverPhases, optionStatus, winds, tileGroupTypes
} = require('./constants');

// Array of numbers from 0 to 135
const fourPlayersTiles = [...Array(136).keys()];
const threePlayersTiles = [] // Currently unavailable

function Group(type, triggerSeatWind, tiles) {
  this.type = type;
  this.triggerSeatWind = triggerSeatWind;
  this.tiles = tiles;
}

function Player({ name, isBot, seatWind }) {
  this.name = name;
  this.isBot = isBot;

  this.seatWind = seatWind;

  this.drawnTile = null;
  this.forbiddenTiles = []; // Disable call swapping (Kuikae)

  this.hand = []; // Sorted
  // NOTE: tileGroups array is ordered by the time of formation
  this.tileGroups = []; // Array of: groups: type, triggeredSeatWind, tiles
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
    this.callOptionWaitlist = [...Array(3).keys()].map(() => Array(maxPlayers));

  }


  // Main action handler, will reset optionsBuffer and callOptionWaitlist
  transform(action) {
    this.changePhase(serverPhases.PROCESSING_ACTION);
    console.log(`Transforming ${JSON.stringify(action)}`);
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
        this.chii(seatWind, data.acceptedCandidate, data.triggerTile);
        break;
      }

      case actionTypes.ACTION_PON: {
        this.pon(seatWind, data.acceptedCandidate, data.triggerTile);
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


  // Basic operations
  drawLiveWall(seatWind) {
    // Assume liveWall is not []
    let tile = this.roundData.liveWall.shift();
    this.playersData[seatWind].drawnTile = tile;
    return tile;
  }

  drawDeadWall(seatWind) {

  }


  // Action executor functions
  // If call options generated, optionsBuffer and callOptionWaitlist will be set
  // Otherwise draw options are generated, optionsBuffer will be set
  // In both cases phase will be reset
  discard(seatWind, tile) {
    let player = this.playersData[seatWind];

    // Update the discarding player's data
    // If the tile is not the just drawn tile, update the hand
    if (player.drawnTile !== tile) {
      player.hand.splice(player.hand.indexOf(tile), 1);
      // If the discard is right after call action (no drawn tile), just discard
      if (player.drawnTile !== null) {
        player.hand.push(player.drawnTile);
        player.hand.sort(tileCompare);
      }
    }
    // Otherwise, the hand is not changed
    player.drawnTile = null;
    player.discardPile.push(tile);
    this.roundData.callTriggerTile = tile;

    // Update optionsBuffer
    this.optionsBuffer = this.generateCallOptions(seatWind);

    // Update the callOptionWaitlist
    this.syncCallOptionWaitlist();

    if (this.optionsBuffer.every(playerOptions =>
      playerOptions.length === 0)) {
      // If there is no call option generated (empty optionsBuffer)
      this.proceedToNextDraw();
    } else {
      // If there are call options generated
      // Set phase
      this.changePhase(serverPhases.WAITING_CALL_ACTION);
    }
  }

  chii(seatWind, acceptedCandidate, tile) {
    let player = this.playersData[seatWind];
    player.tileGroups.push(new Group(
      tileGroupTypes.SHUNTSU,
      this.roundData.turnCounter,
      [...acceptedCandidate, tile]
    ));
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));
    // TODO: Set the player's forbiddenTiles data

    // Set the turnCounter to the calling player's seatWind
    this.roundData.callTriggerTile = null;
    this.roundData.turnCounter = seatWind;
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    this.optionsBuffer[seatWind] = this.generateDrawOptions(seatWind, null);
    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }

  pon(seatWind, acceptedCandidate, tile) {
    let player = this.playersData[seatWind];
    player.tileGroups.push(new Group(
      tileGroupTypes.KOUTSU,
      this.roundData.turnCounter,
      [...acceptedCandidate, tile]
    ));
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));
    // TODO: Set the player's forbiddenTiles data

    // Set the turnCounter to the calling player's seatWind
    this.roundData.callTriggerTile = null;
    this.roundData.turnCounter = seatWind;
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    this.optionsBuffer[seatWind] = this.generateDrawOptions(seatWind, null);
    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }


  // Call option priority management
  syncCallOptionWaitlist() {
    this.callOptionWaitlist = [...Array(3).keys()].map(
      () => Array(this.config.maxPlayers));
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
  }

  scanTransformableCallActions() {
    // Idea: For every received user or bot call action, this function should be
    // called to determine if it is the time to transform the game based on
    // current callOptionWaitlist status

    // Transform condition: start looping from the tertiary options to the
    // primary options, execute the option that has no higher-or-equal-priority 
    // option that is PENDING or ACCEPTED
    console.log(`Scanning callOptionWaitlist ${
      JSON.stringify(this.callOptionWaitlist)}`);
    let transformableOptions = [];
    let allRejected = false;
    let currentPriority = this.callOptionWaitlist.length - 1;
    let highestClearedPriority = -1;
    let highestNonEmptyPriority = this.callOptionWaitlist.findIndex(
      priorityOptions => priorityOptions.some(option => option));
    // If there is no options, return immediately
    if (highestNonEmptyPriority === -1) {
      return transformableOptions;
    }
    while (currentPriority >= highestNonEmptyPriority) {
      let candidateOptions = this.callOptionWaitlist[
        currentPriority].filter(option => option);
      // NOTE: Array.every will return true for empty arrays
      if (candidateOptions.length !== 0 &&
        candidateOptions.every(option =>
          option.status !== optionStatus.PENDING)) {
        highestClearedPriority = currentPriority;
      }
      currentPriority--;
    }
    if (highestClearedPriority === highestNonEmptyPriority) {
      let acceptPriority = this.callOptionWaitlist.findIndex(
        priorityOptions => priorityOptions.some(option =>
          option.status === optionStatus.ACCEPTED));
      if (acceptPriority !== -1) {
        // If there is any accepted option
        transformableOptions = this.callOptionWaitlist[acceptPriority].filter(
          option => option.status === optionStatus.ACCEPTED);
      } else {
        // Otherwise, all options are rejected
        allRejected = true;
      }
    }
    let transformables = transformableOptions.map(option =>
      this.optionToAction(option));
    console.log(`Scan result ${JSON.stringify(transformables)}${
      allRejected ? ' All options are rejected' : ''}`);
    return { allRejected, transformables };
  }

  proceedToNextDraw() {
    if (this.roundData.liveWall.length === 0) {
      // If this is the last discard, end the current turn

      // TODO: Configure player score changes here
      this.endRoundTurn();
    } else {
      // Otherwise, move to the next player's draw time
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
  }


  // Main option generator units
  // NOTE: If triggerTile is null, only OPTION_DISCARD can be generated
  generateOption(type, seatWind, triggerTile, triggerSeatWind) {
    let { hand, tileGroups, discardPile } = this.playersData[seatWind];
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
      // (the index of the group in player's tileGroups array)
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
      // data: triggerTile: tile
      //       candidateTiles: Array of arrays: [] (2 tiles),
      //       acceptedCandidate: Array of 2 tiles 
      case actionTypes.OPTION_CHII: {
        let tileSuit = tileSuitOf(triggerTile);
        let tileNum = tileNumOf(triggerTile); // 1 ~ 9
        if ((triggerSeatWind + 1) % 4 === seatWind &&
          tileSuit != tileTypes.JIHAI) {
          // Find sequences
          let sequenceCandidates = [[], [], [], []]; // Types
          // NOTE: This algorithm can be improved
          hand.forEach(tile => {
            if (tileSuitOf(tile) === tileSuit) {
              let numDiff = tileNumOf(tile) - tileNum;
              let index = numDiff < 0 ? numDiff + 2 : numDiff + 1;
              let tileType = tileTypeOf(tile, { redDoraFlag: true });
              if (numDiff <= 2 && numDiff >= -2 && numDiff !== 0 &&
                sequenceCandidates[index].every(cand => tileTypeOf(cand, {
                  redDoraFlag: true
                }) !== tileType)) {
                sequenceCandidates[index].push(tile);
              }
            }
          });
          let candidateTiles = [];
          for (let i = 0; i < 3; i++) {
            if (sequenceCandidates[i].length !== 0 &&
              sequenceCandidates[i + 1].length !== 0) {
              sequenceCandidates[i].forEach(tile_1 => {
                sequenceCandidates[i + 1].forEach(tile_2 => {
                  candidateTiles.push([tile_1, tile_2]);
                });
              });
            }
          }
          if (candidateTiles.length > 0) {
            return new Option(type, seatWind, {
              triggerTile, candidateTiles, acceptedCandidate: null
            });
          }
        }
        return null;
      }

      // data: triggerTile: tile
      //       candidateTiles: Array of arrays: [] (2 tiles),
      //       acceptedCandidate: Array of 2 tiles 
      case actionTypes.OPTION_PON: {
        let tileSuit = tileSuitOf(triggerTile);
        let tileType = tileTypeOf(triggerTile);
        let tileNum = tileNumOf(triggerTile);
        let sameTiles = hand.filter(tile => tileTypeOf(tile) === tileType);

        let candidateTiles;
        if (sameTiles.length >= 2) {
          candidateTiles = [sameTiles.slice(0, 2)];

          // Here the red-doras are handled as special cases
          if (sameTiles.length === 3 && tileNum === 5 &&
            tileSuit !== tileTypes.JIHAI) {
            let redDoras = [];
            let nonRedDoras = [];
            sameTiles.forEach(tile => {
              if (isRedDora(tile)) {
                redDoras.push(tile);
              } else {
                nonRedDoras.push(tile);
              }
            });
            if (redDoras.length === 0) {
              candidateTiles = [nonRedDoras.slice(0, 2)];
            } else if (redDoras.length === 1) {
              candidateTiles = [[nonRedDoras[0], redDoras[0]], nonRedDoras];
            } else {
              candidateTiles = [redDoras, [nonRedDoras[0], redDoras[0]]];
            }
          }
          return new Option(type, seatWind, {
            triggerTile, candidateTiles, acceptedCandidate: null
          });
        }
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


  // Bot move generators
  performBotDrawAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
    let drawOptions = this.optionsBuffer[seatWind];
    let { hand } = this.playersData[seatWind];

    // STUPID bots will perform any options they have, prioritizing TSUMO,
    // RIICHI over KANs over DISCARD, choices between tile groups and discarding
    // tiles are performed randomly
    let drawOptionTypes = [
      actionTypes.OPTION_TSUMO,
      actionTypes.OPTION_RIICHI,
      actionTypes.OPTION_KAN_CLOSED,
      actionTypes.OPTION_KAN_OPEN_DRAW,
      actionTypes.OPTION_DISCARD
    ];
    let options = drawOptionTypes.map(type =>
      drawOptions.find(option => option.type === type));

    // Accept the first non-null option and reject the following options
    let acceptedFlag = false;
    for (let i = 0; i < options.length; i++) {
      if (!!options[i]) {
        let option = options[i];
        if (acceptedFlag) {
          // Options of lower priority for the STUPID bot will not be accepted
          option.status = optionStatus.REJECTED;
        } else {
          option.status = optionStatus.ACCEPTED;
          let actionType = this.optionToActionType(option.type);
          switch (option.type) {
            case actionTypes.OPTION_TSUMO: break;
            case actionTypes.OPTION_RIICHI: break;
            case actionTypes.OPTION_KAN_CLOSED: break;
            case actionTypes.OPTION_KAN_OPEN_DRAW: break;
            case actionTypes.OPTION_DISCARD: {
              let randIndex = Math.floor(Math.random() * hand.length);
              this.transform({
                type: actionType,
                seatWind,
                data: { tile: hand[randIndex] }
              });
              break;
            }
          }
          // Marking that the following scanned options will be rejected
          acceptedFlag = true;
        }
      }
    }
  }

  performBotCallAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
    let callOptions = this.optionsBuffer[seatWind];
    let { hand } = this.playersData[seatWind];

    // NOTE: Here assume the call options have been filled in the waitlist
    // inside routines like discard() or when handling other draw actions

    // STUPID bots will perform any options they have, prioritizing from RON,
    // KAN_OPEN_CALL, PON, to CHII
    let callOptionTypes = [
      actionTypes.OPTION_RON,
      actionTypes.OPTION_KAN_OPEN_CALL,
      actionTypes.OPTION_PON,
      actionTypes.OPTION_CHII
    ];

    // 0: RON, 1: KAN_OPEN_CALL, 2: PON, 3: CHII
    let options = callOptionTypes.map(type =>
      callOptions.find(option => option.type === type));

    // Accept the first non-null option and reject the following options
    let acceptedFlag = false;
    for (let i = 0; i < options.length; i++) {
      if (options[i]) {
        let option = options[i];
        if (acceptedFlag) {
          // Options of lower priority for the STUPID bot will not be accepted
          option.status = optionStatus.REJECTED;
        } else {
          switch (option.type) {
            case actionTypes.OPTION_RON: break;
            case actionTypes.OPTION_KAN_OPEN_CALL:
            case actionTypes.OPTION_PON:
            case actionTypes.OPTION_CHII: {
              // For KAN_OPEN_CALL, PON, and CHII
              // STUPID bot will only choose the 1st candidate tile group
              option.data.acceptedCandidate = option.data.candidateTiles[0];
              break;
            }
          }
          option.status = optionStatus.ACCEPTED;
          // Marking that the following scanned options will be rejected
          acceptedFlag = true;
        }
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
      this.generateOption(type, drawSeatWind, tile, drawSeatWind)
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
          this.roundData.callTriggerTile, discardSeatWind)).filter(option =>
            option !== null));
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
      player.tileGroups = [];
      // player.hand = shuffledTiles.slice(
      //   index * 13, (index + 1) * 13).sort(tileCompare);
      player.hand = [
        [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50],
        [54, 58, 3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43],

        [28, 29, 32, 33, 36, 37, 40, 41, 44, 45, 48, 49, 52],
        [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25],

      ][index]
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


  // Option related helper functions
  optionTypeOf(option) { return Math.floor(option.type / 10); }
  // Convert option type to corresponding action type
  optionToActionType(type) { return type + 20; }
  // Convert option to corresponding action
  optionToAction(option) {
    if (this.optionTypeOf(option) < actionTypes.DRAW_ACTION) {
      let type = this.optionToActionType(option.type);
      return { ...option, type };
    }
    return null;
  }


  // Getters
  getPhase() { return this.phase; }
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

// Tile value computations
function tileSuitOf(tile) { return Math.floor(tile / 36); }
function tileNumOf(tile) { return Math.floor(tile / 4) % 9 + 1; }
function tileTypeOf(tile, config = { redDoraFlag: false }) {
  if (config.redDoraFlag && Object.values(redDoraTileValues).includes(tile)) {
    return tile === redDoraTileValues.RED_MAN_5_1 ?
      tileTypes.RED_MAN_5 : tile === redDoraTileValues.RED_SOU_5_1 ?
        tileTypes.RED_SOU_5 : tileTypes.RED_PIN_5;
  }
  return Math.floor(tile / 4);
}
function isRedDora(tile) {
  return tileTypeOf(tile) !== tileTypeOf(tile, { redDoraFlag: true });
}

// Compare function of tiles
function tileCompare(x, y) { return x < y ? -1 : x > y ? 1 : 0; }

module.exports = Game;