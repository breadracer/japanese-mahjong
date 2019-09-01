// NOTE: This code is temporarily only designed for 4p games
// For further compatability of 3p games, add child classes for the Game class

const {
  actionTypes, tileTypes, redDoraTileValues, callTriggerTypes,
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

  // One turn data, automatically reset to false upon the next draw
  this.kanFlag = false;
  this.riichiFlag = false;

  // Update upon the next draw of the action
  this.riichiStick = false; // Indicate the formal riichi state

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

function Yaku(type, han) {
  this.type = type;
  this.han = han;
}

function Yakuman(type, multiplier) {
  this.type = type;
  this.multiplier = multiplier;
}

function WinResult(seatWind, triggerSeatWind, parsedTileGroups,
  yakus, yakumans, han, fu, pointValue) {
  this.seatWind = seatWind;
  this.triggerSeatWind = triggerSeatWind;

  this.parsedTileGroups = parsedTileGroups; // Array of Groups
  this.yakus = yakus; // Array of Yakus
  this.yakumans = yakumans; // Array of Yakumans
  this.han = han;
  this.fu = fu;
  this.pointValue = pointValue;
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
      roundWindCounter: 0, // Start from 0, index for the EAST player


      // Server-side only
      endFlag: false // Indicate the end of the whole game
    };
    this.roundData = {
      // One-round data
      liveWall: [], // length: 122 (4p)
      deadWall: [], // length: 14 (4p)
      turnCounter: 0,  // Indicator for the next moving player, start from EAST
      callTriggerTile: null, // Most recent discard or draw-time-kan tile

      // Update upon the next draw of the action
      kanCounter: 0, // Indicator for doras and the position of haiteihai

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
    // 3-d array of options: type, seatWind, data, status
    this.callOptionWaitlist = [...Array(3).keys()].map(() =>
      [...Array(maxPlayers).keys()].map(() => []));

    this.winResultsBuffer = Array(maxPlayers);

  }


  // Main action handler, will reset optionsBuffer and callOptionWaitlist
  transform(actions) {
    this.changePhase(serverPhases.PROCESSING_ACTION);
    console.log(`Transforming ${JSON.stringify(actions)}`);

    let numLeftAction = actions.length;
    actions.forEach(action => {
      numLeftAction--;
      let { type, seatWind, data } = action;
      switch (type) {
        // data: tile
        case actionTypes.ACTION_DISCARD: {
          this.discard(seatWind, data.tile);
          break;
        }
  
        case actionTypes.ACTION_KAN_CLOSED: {
          this.kanClosed(seatWind, data.acceptedCandidate);
          break;
        }
  
        case actionTypes.ACTION_KAN_OPEN_DRAW: {
          this.kanOpenDraw(seatWind, data.acceptedCandidateInfo);
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
          this.kanOpenCall(seatWind, data.acceptedCandidate, data.triggerTile);
          break;
        }
  
        case actionTypes.ACTION_RON_DISCARD: {
          this.ronDiscard(seatWind, data.winResult, numLeftAction);
          break;
        }
  
        case actionTypes.ACTION_RON_KAN_OPEN_DRAW: {
          break;
        }
  
        case actionTypes.ACTION_RON_KAN_CLOSED: {
          break;
        }
      }
    });
  }


  // Basic operations
  drawLiveWall(seatWind) {
    // Assume liveWall is not []
    let tile = this.roundData.liveWall.shift();
    this.playersData[seatWind].drawnTile = tile;
    return tile;
  }

  drawDeadWall(seatWind) {
    // Assume deadWall is not []
    let tile = this.roundData.deadWall.shift();
    this.playersData[seatWind].drawnTile = tile;
    return tile;
  }


  // Action executor functions
  // If call options generated, will set optionsBuffer and callOptionWaitlist
  // Otherwise draw options are generated, optionsBuffer will be set
  // In both cases phase will be reset
  discard(seatWind, tile) {
    let player = this.playersData[seatWind];

    // Update the discarding player's data
    // If the tile is not the just drawn tile, update the hand
    if (player.drawnTile !== tile) {
      player.hand.splice(player.hand.indexOf(tile), 1);
      // If the discard is right after call action (no
      // drawn tile), just discard
      if (player.drawnTile !== null) {
        player.hand.push(player.drawnTile);
        player.hand.sort(tileCompare);
      }
    }
    // Otherwise, the hand is not changed
    player.drawnTile = null;
    player.discardPile.push(tile);
    this.roundData.callTriggerTile = tile;

    // Check if the player has just kanned or riichied
    if (player.kanFlag === true) {
      this.roundData.kanCounter++;
      player.kanFlag = false;
    }
    if (player.riichiFlag === true) {
      player.riichiStick = true;
      player.riichiFlag = false;
    }

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
      tileGroupTypes.SHUNTSU_OPEN,
      this.roundData.turnCounter,
      [...acceptedCandidate, tile]
    ));
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));
    // TODO: Set the player's forbiddenTiles data

    // Set the turnCounter to the calling player's seatWind
    this.roundData.callTriggerTile = null;
    this.roundData.turnCounter = seatWind;
    // Clear optionsBuffer and callOptionWaitlist
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    this.optionsBuffer[seatWind] = this.generateDrawOptions(seatWind, null);
    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }

  pon(seatWind, acceptedCandidate, tile) {
    let player = this.playersData[seatWind];
    player.tileGroups.push(new Group(
      tileGroupTypes.KOUTSU_OPEN,
      this.roundData.turnCounter,
      [...acceptedCandidate, tile]
    ));
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));
    // TODO: Set the player's forbiddenTiles data

    // Set the turnCounter to the calling player's seatWind
    this.roundData.callTriggerTile = null;
    this.roundData.turnCounter = seatWind;
    // Clear optionsBuffer and callOptionWaitlist
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    this.optionsBuffer[seatWind] = this.generateDrawOptions(seatWind, null);
    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }

  kanOpenCall(seatWind, acceptedCandidate, tile) {
    let player = this.playersData[seatWind];
    player.tileGroups.push(new Group(
      tileGroupTypes.KANTSU_OPEN,
      this.roundData.turnCounter,
      [...acceptedCandidate, tile]
    ));
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));

    // Set the player's kanFlag to true
    player.kanFlag = true;
    // Set the turnCounter to the calling player's seatWind
    this.roundData.callTriggerTile = null;
    this.roundData.turnCounter = seatWind;
    // Clear optionsBuffer and callOptionWaitlist
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    // Draw from deadWall
    let drawnTile = this.drawDeadWall(seatWind);
    this.optionsBuffer[seatWind] = this.generateDrawOptions(
      seatWind, drawnTile);
    // Set phase
    this.changePhase(serverPhases.WAITING_DRAW_ACTION);
  }

  kanClosed(seatWind, acceptedCandidate) {
    let player = this.playersData[seatWind];
    player.tileGroups.push(new Group(
      tileGroupTypes.KANTSU_CLOSED,
      this.roundData.turnCounter,
      acceptedCandidate
    ));

    // If the kan is right after another kan, insert the drawn tile into hand
    if (player.drawnTile !== null) {
      player.hand.push(player.drawnTile);
      player.hand.sort(tileCompare);
      player.drawnTile = null;
    }
    player.hand = player.hand.filter(tile =>
      !acceptedCandidate.includes(tile));

    // Update callTriggerTile
    this.roundData.callTriggerTile = acceptedCandidate[0];

    // Check if the player has just kanned
    if (player.kanFlag === true) {
      this.roundData.kanCounter++;
      player.kanFlag = false;
    }

    // First generate call options, if empty, generate draw options
    this.optionsBuffer = this.generateKanTriggeredCallOptions(
      seatWind, actionTypes.ACTION_KAN_CLOSED);

    // Update the callOptionWaitlist
    this.syncCallOptionWaitlist();

    if (this.optionsBuffer.every(playerOptions =>
      playerOptions.length === 0)) {
      // If there is no call option generated (Most of the times)
      // Set the player's kanFlag to true
      player.kanFlag = true;
      let drawnTile = this.drawDeadWall(seatWind);
      // Update optionsBuffer
      this.optionsBuffer[seatWind] = this.generateDrawOptions(
        seatWind, drawnTile);
      // Set phase
      this.changePhase(serverPhases.WAITING_DRAW_ACTION);
    } else {
      // If there are call options generated
      // Set phase
      this.changePhase(serverPhases.WAITING_CALL_ACTION);
    }
  }

  kanOpenDraw(seatWind, acceptedCandidateInfo) {
    let player = this.playersData[seatWind];
    let { groupIndex, tile: candidateTile } = acceptedCandidateInfo;

    // Update the target tile group
    let targetTileGroup = player.tileGroups[groupIndex];
    targetTileGroup.type = tileGroupTypes.KANTSU_OPEN;
    targetTileGroup.tiles.push(candidateTile);

    // If the kan is right after another kan, insert the drawn tile into hand
    if (player.drawnTile !== null) {
      player.hand.push(player.drawnTile);
      player.hand.sort(tileCompare);
      player.drawnTile = null;
    }
    player.hand = player.hand.filter(tile => tile !== candidateTile);

    // Update callTriggerTile
    this.roundData.callTriggerTile = candidateTile;

    // Check if the player has just kanned
    if (player.kanFlag === true) {
      this.roundData.kanCounter++;
      player.kanFlag = false;
    }

    // First generate call options, if empty, generate draw options
    this.optionsBuffer = this.generateKanTriggeredCallOptions(
      seatWind, actionTypes.ACTION_KAN_OPEN_DRAW);

    // Update the callOptionWaitlist
    this.syncCallOptionWaitlist();

    if (this.optionsBuffer.every(playerOptions =>
      playerOptions.length === 0)) {
      // If there is no call option generated (Most of the times)
      // Set the player's kanFlag to true
      player.kanFlag = true;
      let drawnTile = this.drawDeadWall(seatWind);
      // Update optionsBuffer
      this.optionsBuffer[seatWind] = this.generateDrawOptions(
        seatWind, drawnTile);
      // Set phase
      this.changePhase(serverPhases.WAITING_DRAW_ACTION);
    } else {
      // If there are call options generated
      // Set phase
      this.changePhase(serverPhases.WAITING_CALL_ACTION);
    }
  }

  ronDiscard(seatWind, winResult, numLeftRon) {
    this.winResultsBuffer[seatWind] = winResult;
    if (numLeftRon === 0) {
      this.endRoundTurn();
    }
  }

  // Action execution helper functions
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


  // Call option priority management
  syncCallOptionWaitlist() {
    this.callOptionWaitlist = [...Array(3).keys()].map(() =>
      [...Array(this.config.maxPlayers).keys()].map(() => []));
    let callOptions = this.optionsBuffer.reduce((acc, val) =>
      acc.concat(val), []);
    callOptions.forEach(option => {
      switch (option.type) {
        case actionTypes.OPTION_RON_DISCARD:
        case actionTypes.OPTION_RON_KAN_OPEN_DRAW:
        case actionTypes.OPTION_RON_KAN_CLOSED: {
          this.callOptionWaitlist[0][option.seatWind].push(option);
          break;
        }
        case actionTypes.OPTION_PON:
        case actionTypes.OPTION_KAN_OPEN_CALL: {
          this.callOptionWaitlist[1][option.seatWind].push(option);
          break;
        }
        case actionTypes.OPTION_CHII: {
          this.callOptionWaitlist[2][option.seatWind].push(option);
          break;
        }
      }
    });
  }

  scanTransformableCallActions() {
    // Idea: For every received user or bot call action, this function should 
    // be called to determine if it is the time to transform the game based on
    // current callOptionWaitlist status

    // Transform condition: start looping from the tertiary options to the
    // primary options, execute the option that has no 
    // higher-or-equal-priority option that is PENDING or ACCEPTED

    // NOTE: This algorithm can be improved
    console.log(`Scanning callOptionWaitlist ${
      JSON.stringify(this.callOptionWaitlist)}`);
    let transformableOptions = [];
    let allRejected = false;
    let currentPriority = this.callOptionWaitlist.length - 1;
    let highestClearedPriority = -1;
    let highestNonEmptyPriority = this.callOptionWaitlist.findIndex(
      priorityOptions => priorityOptions.some(options => options.length !== 0));
    // If there is no options, return immediately
    if (highestNonEmptyPriority === -1) {
      return transformableOptions;
    }
    while (currentPriority >= highestNonEmptyPriority) {
      let candidateOptions = this.callOptionWaitlist[currentPriority].reduce(
        (acc, val) => acc.concat(val), []);
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
        priorityOptions => priorityOptions.reduce((acc, val) =>
          acc.concat(val), []).some(option =>
            option.status === optionStatus.ACCEPTED));
      if (acceptPriority !== -1) {
        // If there is any accepted option
        transformableOptions = this.callOptionWaitlist[acceptPriority].reduce(
          (acc, val) => acc.concat(val), []).filter(option =>
            option.status === optionStatus.ACCEPTED);
      } else {
        // Otherwise, check if all options are rejected
        allRejected = this.callOptionWaitlist.reduce((acc, val) =>
          acc.concat(val), []).reduce((acc, val) =>
            acc.concat(val), []).every(option =>
              option.status === optionStatus.REJECTED);
      }
    }
    let transformables = transformableOptions.map(option =>
      this.optionToAction(option));
    console.log(`Scan result ${JSON.stringify(transformables)}${
      allRejected ? ' All options are rejected' : ''}`);
    return { allRejected, transformables };
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

      // data: candidateTiles: Array of arrays: [] (4 tiles),
      //       acceptedCandidate: Array of 4 tiles
      case actionTypes.OPTION_KAN_CLOSED: {
        // Find the 4 same tiles out of the sorted hand
        let drawnHand = [...hand, triggerTile].sort(tileCompare);
        let candidateTiles = [];
        let sameTypeStart = 0, sameTypeEnd = 0;
        let prevTileType = -1, currTileType;
        for (let i = 0; i < drawnHand.length; i++) {
          currTileType = tileTypeOf(drawnHand[i]);
          if (currTileType === prevTileType) {
            sameTypeEnd = i + 1;
          } else {
            sameTypeStart = i;
            prevTileType = currTileType;
          }
          if (sameTypeEnd - sameTypeStart === 4) {
            candidateTiles.push(drawnHand.slice(sameTypeStart, sameTypeEnd));
          }
        }
        if (candidateTiles.length !== 0) {
          return new Option(type, seatWind, {
            candidateTiles, acceptedCandidate: null
          });
        }
        return null;
      }

      // data: candidateInfo: Array of: groupIndex: index, tile: tile
      //       acceptedCandidateInfo: groupIndex: index, tile: tile
      case actionTypes.OPTION_KAN_OPEN_DRAW: {
        let drawnHand = [...hand, triggerTile].sort(tileCompare);
        // Find all KOUTSU_OPEN forming tile type in player's tileGroups
        let indexedKoutsuTileTypes = tileGroups.map(group =>
          group.type === tileGroupTypes.KOUTSU_OPEN ?
            tileTypeOf(group.tiles[0]) : null);
        let candidateInfo = [];
        indexedKoutsuTileTypes.forEach((tileType, index) => {
          let candidate = drawnHand.find(tile =>
            tileTypeOf(tile) === tileType);
          if (candidate !== undefined) {
            candidateInfo.push({ groupIndex: index, tile: candidate });
          }
        });
        if (candidateInfo.length !== 0) {
          return new Option(type, seatWind, {
            candidateInfo, acceptedCandidate: null
          });
        }
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
        let tileType = tileTypeOf(triggerTile);
        let sameTiles = hand.filter(tile => tileTypeOf(tile) === tileType);
        let candidateTiles;
        if (sameTiles.length >= 3) {
          candidateTiles = [sameTiles.slice(0, 3)];
          return new Option(type, seatWind, {
            triggerTile, candidateTiles, acceptedCandidate: null
          });
        }
        return null;
      }

      // data: WinResult
      case actionTypes.OPTION_RON_DISCARD:
        return this.generateRonOption(seatWind,
          triggerTile, triggerSeatWind, callTriggerTypes.DISCARD);


      case actionTypes.OPTION_RON_KAN_OPEN_DRAW: {
        return null;
      }

      case actionTypes.OPTION_RON_KAN_CLOSED: {
        return null;
      }
    }
  }

  // RON related operations
  generateRonOption(seatWind, triggerTile, triggerSeatWind, callTriggerType) {
    let { hand, tileGroups, discardPile } = this.playersData[seatWind];
    let formedHand = [...hand, triggerTile].sort(tileCompare);

    // First, parse the given hand into tile groups (upon 3 pattern types)
    let parsedTileGroups = [];

    // For normal patterns
    let numLeftMentsu = 4 - tileGroups.length;
    let numLeftToitsu = 1;
    this.parseTilesNormal(
      formedHand, numLeftMentsu, numLeftToitsu,
      [], parsedTileGroups, seatWind
    );
    parsedTileGroups.forEach(result =>
      tileGroups.forEach(group => result.push(group)));

    if (tileGroups.length === 0) {
      // For Chiitoitsu
      this.parseTilesChiitoitsu(formedHand, parsedTileGroups, seatWind);

      // For Kokushimusou
      this.parseTilesKokushimusou(formedHand, parsedTileGroups, seatWind);
    }

    if (parsedTileGroups.length !== 0) {
      // Then, for each of the parsed result, compute the yakus of each
      // and retain the one that generate the highest score
      let maxScore = 0;
      let yakumanFlag = false;
      let optimalWinResult = null;

      for (let tileGroup of parsedTileGroups) {
        let currWinResult = this.calculateWinResult(
          tileGroup, seatWind, triggerSeatWind);
        let currScore = currWinResult.pointValue;

        // NOTE: If there is any tileGroup that generates yakumans, the 
        // resulting returned WinResult must include yakumans
        if (!yakumanFlag) {
          if (currWinResult.yakumans.length !== 0) {
            yakumanFlag = true;
          }
          if (currScore >= maxScore) {
            maxScore = currScore;
            optimalWinResult = currWinResult;
          }
        } else if (currWinResult.yakumans.length !== 0 &&
          currScore >= maxScore) {
          maxScore = currScore;
          optimalWinResult = currWinResult;
        }
      }

      // Index: callTriggerType (0 ~ 2)
      let optionTypes = [
        actionTypes.OPTION_RON_DISCARD,
        actionTypes.OPTION_RON_KAN_OPEN_DRAW,
        actionTypes.OPTION_RON_KAN_CLOSED
      ];
      return new Option(optionTypes[callTriggerType],
        seatWind, { winResult: optimalWinResult });

    } else {
      return null;
    }
  }

  // Tile group parsing functions
  parseTilesNormal(tiles, numLeftMentsu, numLeftToitsu,
    prevParts, parsedTileGroups, seatWind) {
    if (tiles.length === 0) {
      parsedTileGroups.push(prevParts);
    } else {
      // Try match the first tile with the following tiles
      let currTileType = tileTypeOf(tiles[0]);
      let currTileSuit = tileSuitOf(tiles[0]);
      let currTileNum = tileNumOf(tiles[0]);

      let toitsu = [tiles[0]], shuntsu = [tiles[0]], koutsu = [tiles[0]];

      // Find number of consecutive tiles of same type
      let numSameTiles = 1;
      for (let i = 1; i < tiles.length &&
        tileTypeOf(tiles[i]) === currTileType && numSameTiles < 3; i++) {
        numSameTiles++;
        if (numSameTiles === 2) {
          toitsu.push(tiles[i]);
        }
        koutsu.push(tiles[i]);
      }

      // Find a three-sequence if there exists one
      let tileNumDiff = 1;
      for (let i = 1; i < tiles.length &&
        tileSuitOf(tiles[i]) === currTileSuit && tileNumDiff < 3; i++) {
        if (tileNumOf(tiles[i]) === currTileNum + tileNumDiff) {
          shuntsu.push(tiles[i]);
          tileNumDiff++;
        }
      }

      // Parse the rest of the tiles recursively
      if (shuntsu.length === 3 && numLeftMentsu > 0) {
        let leftTiles = tiles.filter(tile => !shuntsu.includes(tile));
        this.parseTilesNormal(leftTiles, numLeftMentsu - 1, numLeftToitsu,
          [...prevParts, new Group(tileGroupTypes.SHUNTSU_CLOSED,
            seatWind, shuntsu)], parsedTileGroups, seatWind);
      }

      if (koutsu.length === 3 && numLeftMentsu > 0) {
        let leftTiles = tiles.filter(tile => !koutsu.includes(tile));
        this.parseTilesNormal(leftTiles, numLeftMentsu - 1, numLeftToitsu,
          [...prevParts, new Group(tileGroupTypes.KOUTSU_CLOSED,
            seatWind, koutsu)], parsedTileGroups, seatWind);
      }

      if (toitsu.length === 2 && numLeftToitsu > 0) {
        let leftTiles = tiles.filter(tile => !toitsu.includes(tile));
        this.parseTilesNormal(leftTiles, numLeftMentsu, numLeftToitsu - 1,
          [...prevParts, new Group(tileGroupTypes.TOITSU,
            seatWind, toitsu)], parsedTileGroups, seatWind);
      }
    }
  }

  parseTilesChiitoitsu(tiles, parsedTileGroups, seatWind) {
    // Assume length of the tiles is 14
    let toitsuList = [];
    let prevTileType = -1;
    for (let i = 0; i < tiles.length; i += 2) {
      let currTileType = tileTypeOf(tiles[i]);
      let nextTileType = tileTypeOf(tiles[i + 1]);
      if (currTileType === nextTileType && currTileType !== prevTileType) {
        prevTileType = currTileType;
        toitsuList.push(new Group(tileGroupTypes.TOITSU,
          seatWind, [tiles[i], tiles[i + 1]]));
      } else {
        break;
      }
    }

    if (toitsuList.length === 7) {
      toitsuList.forEach(toitsu => parsedTileGroups.push(toitsu));
    }
  }

  parseTilesKokushimusou(tiles, parsedTileGroups, seatWind) {
    // Assume length of the tiles is 14
    let yaoList = [];
    let prevTileType = -1;
    let repeatedFlag = false;
    for (let i = 0; i < tiles.length; i++) {
      let currTileType = tileTypeOf(tiles[i]);
      let currTileNum = tileNumOf(tiles[i]);
      let currTileSuit = tileSuitOf(tiles[i]);
      if (currTileSuit === tileTypes.JIHAI ||
        currTileNum === 1 || currTileNum === 9) {
        // For repeated Yao tiles
        if (currTileType === prevTileType) {
          if (repeatedFlag === true) {
            break;
          } else {
            repeatedFlag = true;
          }
        }
        yaoList.push(new Group(tileGroupTypes.YAO, seatWind, [tiles[i]]));
      } else {
        break;
      }
    }

    if (yaoList.length === 14) {
      yaoList.forEach(yao => parsedTileGroups.push(yao));
    }
  }


  // Score computations for given tile groups
  calculateWinResult(tileGroups, seatWind, triggerSeatWind) {
    let han = 0, fu = 0, pointValue = 0, yakus = [], yakumans = [];

    // Calculate Han from Yakus (or Yakumans)

    // Calculate Han from Doras

    // Calculate Fu

    // Calculate point value

    return new WinResult(seatWind, triggerSeatWind, tileGroups,
      yakus, yakumans, han, fu, pointValue);
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
      actionTypes.OPTION_RON_DISCARD
    ];
    return Object.values(winds).map(seatWind =>
      seatWind === discardSeatWind ? []
        : optionTypes.map(type => this.generateOption(type, seatWind,
          this.roundData.callTriggerTile, discardSeatWind)).filter(option =>
            option !== null));
  }

  generateKanTriggeredCallOptions(kanSeatWind, type) {
    let optionType = type === actionTypes.ACTION_KAN_CLOSED ?
      actionTypes.OPTION_RON_KAN_CLOSED : actionTypes.OPTION_RON_KAN_OPEN_DRAW;
    return Object.values(winds).map(seatWind =>
      seatWind === kanSeatWind ? []
        : [this.generateOption(optionType, seatWind,
          this.roundData.callTriggerTile, kanSeatWind)].filter(option =>
            option !== null));
  }


  // Bot move generators
  performBotDrawAction(seatWind) {
    // TODO: Distinguish different type of bots, currently every bot will
    // perform as if it is STUPID
    let drawOptions = this.optionsBuffer[seatWind];
    let { hand } = this.playersData[seatWind];

    // STUPID bots will perform any options they have, prioritizing TSUMO,
    // RIICHI over KANs over DISCARD, choices between tile groups and 
    // discarding tiles are performed randomly
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
            case actionTypes.OPTION_KAN_CLOSED: {
              this.transform([{
                type: actionType,
                seatWind,
                data: { acceptedCandidate: option.data.candidateTiles[0] }
              }]);
              break;
            }
            case actionTypes.OPTION_KAN_OPEN_DRAW: {
              this.transform([{
                type: actionType,
                seatWind,
                data: { acceptedCandidateInfo: option.data.candidateInfo[0] }
              }]);
              break;
            }
            case actionTypes.OPTION_DISCARD: {
              let randIndex = Math.floor(Math.random() * hand.length);
              this.transform([{
                type: actionType,
                seatWind,
                data: { tile: hand[randIndex] }
              }]);
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
      actionTypes.OPTION_RON_DISCARD,
      actionTypes.OPTION_RON_KAN_OPEN_DRAW,
      actionTypes.OPTION_RON_KAN_CLOSED,
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
            case actionTypes.OPTION_RON_DISCARD: break;
            case actionTypes.OPTION_RON_KAN_OPEN_DRAW: break;
            case actionTypes.OPTION_RON_KAN_CLOSED: break;
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
      // this.roundData.liveWall = [
      //   72, 72, 72, 72, 72, 72, 76, 76, 76, 76, 76, 80, 80, 80, 80, 80
      // ]
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
      player.hand = shuffledTiles.slice(
        index * 13, (index + 1) * 13).sort(tileCompare);
      // player.hand = [
      //   [27, 31, 35, 39, 43, 54, 58, 73, 77, 81, 85, 86, 87],

      //   [18, 22, 26, 30, 34, 38, 42, 46, 50, 53, 57, 61, 65],

      //   [3, 7, 11, 15, 19, 23, 74, 75, 78, 79, 82, 83, 84],
      //   [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 17],

      // ][index]
    });

    // Resolve first turn's options and reset buffers
    this.optionsBuffer = Array(this.config.maxPlayers).fill([]);
    this.syncCallOptionWaitlist();
    this.winResultsBuffer = Array(this.config.maxPlayers);
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