// Room: users (username), misc info...

// Newly created user session added to the global Game object
// Game: sessions (username -> socket), rooms, misc info...

// Game is an observer, its state will be changed upon ws server receiving
// certain type of messages from individual users, and then certain users in
// the Game will receive the respective change messages

// Game is a singleton of the Game class that is created when server is started

const Session = require('./session');
const Room = require('./room');

const { messageTypes } = require('./constants');

// Async 'sleep' between updates of bot moves
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class GameWorld {
  constructor() {
    this.sessions = {}; // username -> username, socket, isAlive, roomname
    this.rooms = {}; // roomname -> roomname, usernames, game, owner, size
  }

  // Main message handler
  async handleMessage({ type, message }, username) {
    // Assume username's session exists
    switch (type) {
      case messageTypes.PULL_ALL_ROOMS: {
        return this.sendToOne(messageTypes.PUSH_ALL_ROOMS,
          this.getOnlineRoomsMessage(), username);
      }

      case messageTypes.PULL_ALL_USERS: {
        return this.sendToOne(messageTypes.PUSH_ALL_USERS,
          this.getOnlineUsersMessage(), username);
      }

      case messageTypes.PULL_CREATE_ROOM: {
        if (this.addRoom(message.roomname, username, message.maxPlayers)) {
          let room = this.getRoomByRoomname(message.roomname);
          this.sendToAll(messageTypes.PUSH_CREATE_ROOM, {
            isValid: true,
            newRoom: {
              roomname: room.roomname,
              usernames: room.usernames,
              botnames: room.botnames,
              maxPlayers: room.maxPlayers,
              isInGame: room.game !== null,
              owner: room.owner
            }
            // updatedUser is newRoom's owner
          });
        } else {
          this.sendToAll(messageTypes.PUSH_CREATE_ROOM, { isValid: false });
        }
        return;
      }

      case messageTypes.PULL_JOIN_ROOM: {
        if (this.hasRoom(message.roomname) &&
          this.getRoomByRoomname(message.roomname).addUser(username) &&
          this.getSessionByUsername(username).enterRoom(message.roomname)) {
          let room = this.getRoomByRoomname(message.roomname);
          this.sendToAll(messageTypes.PUSH_JOIN_ROOM, {
            isValid: true,
            updatedRoom: {
              roomname: room.roomname,
              usernames: room.usernames,
              botnames: room.botnames,
              maxPlayers: room.maxPlayers,
              owner: room.owner,
            },
            updatedUser: { username, roomname: room.roomname }
          });
        } else {
          this.sendToAll(messageTypes.PUSH_JOIN_ROOM, { isValid: false });
        }
        return;
      }

      case messageTypes.PULL_EXIT_ROOM: {
        if (this.hasRoom(message.roomname) &&
          this.getRoomByRoomname(message.roomname).removeUser(username) &&
          this.getSessionByUsername(username).leaveRoom()) {
          let room = this.getRoomByRoomname(message.roomname);
          this.sendToAll(messageTypes.PUSH_EXIT_ROOM, {
            isValid: true,
            updatedRoom: {
              roomname: room.roomname,
              usernames: room.usernames,
              botnames: room.botnames,
              owner: room.owner
            },
            updatedUser: { username }
          });
          if (room.isEmpty()) {
            this.removeRoom(room.roomname);
          }
        } else {
          this.sendToAll(messageTypes.PUSH_EXIT_ROOM, { isValid: false });
        }
        return;
      }

      // Note: The passed in botType is essentially the botname
      case messageTypes.PULL_ADD_BOT: {
        if (this.hasRoom(message.roomname) &&
          this.getRoomByRoomname(message.roomname).addBot(message.botType)) {
          let room = this.getRoomByRoomname(message.roomname);
          this.sendToAll(messageTypes.PUSH_ADD_BOT, {
            isValid: true,
            updatedRoom: {
              roomname: room.roomname,
              usernames: room.usernames,
              botnames: room.botnames,
              maxPlayers: room.maxPlayers,
              owner: room.owner,
            }
          });
        } else {
          this.sendToAll(messageTypes.PUSH_ADD_BOT, { isValid: false });
        }
        return;
      }

      case messageTypes.PULL_REMOVE_BOT: {
        if (this.hasRoom(message.roomname) &&
          this.getRoomByRoomname(message.roomname).removeBot(message.botname)) {
          let room = this.getRoomByRoomname(message.roomname);
          this.sendToAll(messageTypes.PUSH_REMOVE_BOT, {
            isValid: true,
            updatedRoom: {
              roomname: room.roomname,
              usernames: room.usernames,
              botnames: room.botnames,
              owner: room.owner
            }
          });
        } else {
          this.sendToAll(messageTypes.PUSH_REMOVE_BOT, { isValid: false });
        }
        return;
      }

      case messageTypes.PULL_START_GAME: {
        let room = this.getRoomByRoomname(message.roomname);
        if (room && room.isFull() && !room.isInGame()) {
          // Initialize game data in the target room
          // Generate options for all user and bot players (1st turn)
          room.startGame();

          // Notify the world the target room is in game
          this.sendToAll(messageTypes.PUSH_START_GAME, {
            isValid: true,
            updatedRoom: {
              roomname: room.roomname
            }
          });

          // First, push game data and options to all user players.
          // Since the first option is the draw option, only the first
          // mover will receive valid options
          let players = room.getPlayersData(); // DO NOT MODIFY
          let users = players.filter(player => !player.isBot);
          let bots = players.filter(player => player.isBot);
          users.forEach((player, seatWind) => {
            this.sendToOne(messageTypes.PUSH_UPDATE_GAME, {
              isValid: true,
              roomname: room.roomname,
              game: room.getGameInfo(),
              seatWind,
              options: room.resolveAction(null)[seatWind]
            }, player.name);
          });

          // Then, if the first moving player is bot, let it move first
          // This loop will continue until the first user player can make
          // an active response to an option (draw or call)
          let turnCounter = room.getTurnCounter();
          while (players[turnCounter].isBot) {
            let bot = players[turnCounter];
            // =================================================================
            // TODO
            // First, 'sleep' a while
            await sleep(4000);

            // Second, figure out bot's move based on the draw options

            // NOTE: THE FOLLOWING CODE WILL BE SHARED BY USER ACTION HANDLING
            // Then, generate and push all game data and options to the users


            // Handle other players' call options upon the following cases:
            // Case 1: only users receive call options
            //    In this case, break out the loop since the upcoming
            //    PULL_UPDATE_GAME will be handled by handleMessage() decently

            // Case 2: only bots receive call options
            //    This case is also easy. Just figure out the bot's move here
            //    and push the new data and options, continuing the loop

            // Case 3: users and bots both receive call options, and the
            // dominant option come from the bots
            //    Decide whether the bots will behave actively upon the option.
            //    If so, repeat Case 2. Otherwise, behave like Case 1.
            //    i.e. If bot choose to actively act, directly send the
            //    outcome game data to the users

            // Case 4: users and bots both receive call options, and the
            // dominant option come from the users
            //    First decide whether bots will act actively, then push
            //    the options to the users like Case 1
            //    i.e. The true outcome will depend on both users' moves
            //    and the bots' move

            // Case 5: users and bots both receive call options, and dominant
            // options are shared among users and bots
            //    This happens only for multiple RONs. This case is treated
            //    in the same way as in Case 4

            // Case 6: there is no call options generated
            //    Do nothing, just continue the loop


            // Lastly, update the turn counter. If still bot, continue loop
            turnCounter = room.getTurnCounter();
            // End of this bots' turn. End of TODO
            // =================================================================
          }

        } else {
          this.sendToAll(messageTypes.PUSH_START_GAME, { isValid: false });
        }
        return;
      }

      case messageTypes.PULL_UPDATE_GAME: {
        let room = this.getRoomByRoomname(message.roomname);
        if (room && room.isInGame()) {
          // TODO:
          // First, transform the game

          // Second, push updated game and option data to all users

          // If the next player/players is/are bots,
          // let them move one bot by one bot and push data to all for each move

        } else {
          this.sendToRoom(messageTypes.PUSH_UPDATE_GAME,
            { isValid: false }, room.roomname);
        }
        return;
      }

    }
  }

  // Common message helper functions
  getOnlineRoomsMessage() {
    let onlineRooms = this.getAllRooms().map(r => ({
      roomname: r.roomname,
      usernames: r.usernames,
      botnames: r.botnames,
      maxPlayers: r.maxPlayers,
      isInGame: r.game !== null,
      owner: r.owner
    }));
    return { onlineRooms };
  }

  getOnlineUsersMessage() {
    let onlineUsers = this.getAllSessions().map(s => ({
      username: s.username,
      roomname: s.roomname
    }));
    return { onlineUsers };
  }

  // Message senders
  sendToAll(type, message) {
    this.getAllSessions().forEach(s => s.sendMessage(type, message));
  }

  sendToAllExcept(type, message, username) {
    this.getAllSessions().forEach(s => {
      if (s.username !== username)
        s.sendMessage(type, message);
    });
  }

  sendToRoom(type, message, roomname) {
    this.getSessionsByRoomname(roomname).forEach(s => {
      s.sendMessage(type, message);
    });
  }

  sendToRoomExcept(type, message, roomname, username) {
    this.getSessionsByRoomname(roomname).forEach(s => {
      if (s.username !== username)
        s.sendMessage(type, message);
    });
  }

  sendToOne(type, message, username) {
    this.sessions[username].sendMessage(type, message);
  }

  // Sessions
  getAllSessions() {
    return Object.values(this.sessions);
  }

  getSessionsByRoomname(roomname) {
    return this.rooms[roomname].usernames.filter(
      u => this.hasSession(u)).map(u => this.sessions[u]);
  }

  getSessionByUsername(username) {
    return this.sessions[username] ? this.sessions[username] : null;
  }

  hasSession(username) {
    return this.sessions.hasOwnProperty(username);
  }

  addSession(username, socket) {
    if (!this.sessions[username]) {
      this.sessions[username] = new Session(username, socket);
      return true;
    } else {
      return false;
    }
  }

  removeSession(username) {
    if (this.sessions[username]) {
      let room = this.getRoomByUsername(username);
      // Remove the user from the room if there is one
      if (room) {
        room.removeUser(username);
      }
      delete this.sessions[username];
      return true;
    } else {
      return false;
    }
  }

  // Rooms
  getAllRooms() {
    return Object.values(this.rooms);
  }

  getRoomByUsername(username) {
    let session = this.sessions[username];
    return session && session.roomname ?
      this.rooms[session.roomname] : null;
  }

  getRoomByRoomname(roomname) {
    return this.rooms[roomname] ? this.rooms[roomname] : null;
  }

  hasRoom(roomname) { return this.rooms.hasOwnProperty(roomname); }

  // Add room, set owner, and associate first user with the room
  addRoom(roomname, username, maxPlayers = 4) {
    if (!this.sessions[username].isInRoom() && !this.rooms[roomname]) {
      this.rooms[roomname] = new Room(roomname, maxPlayers);
      this.rooms[roomname].addUser(username);
      this.rooms[roomname].setOwner(username);
      this.getSessionByUsername(username).enterRoom(roomname);
      return true;
    } else {
      return false;
    }
  }

  // Remove room and let each of the users leave the room
  removeRoom(roomname) {
    if (this.rooms[roomname]) {
      let users = this.getSessionsByRoomname(roomname);
      users.forEach(u => { u.leaveRoom(); })
      delete this.rooms[roomname];
      return true;
    } else {
      return false;
    }
  }
}


module.exports = new GameWorld();