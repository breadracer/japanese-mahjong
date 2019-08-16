const Game = require('./game');
const { winds } = require('./constants');

class Room {
  constructor(roomname, maxPlayers) {
    this.roomname = roomname;
    this.maxPlayers = maxPlayers;
    this.usernames = [];
    this.botnames = [];
    this.owner = null;
    this.game = null;
  }

  isFull() {
    return this.usernames.length + this.botnames.length === this.maxPlayers;
  }
  isEmpty() { return this.usernames.length === 0; }
  hasUser(username) { return this.usernames.includes(username); }

  setOwner(username) { this.owner = username; }

  addUser(username) {
    if (!this.isFull() && !this.hasUser(username)) {
      this.usernames.push(username);
      return true;
    } else {
      return false;
    }
  }

  removeUser(username) {
    if (this.hasUser(username)) {
      this.usernames.splice(this.usernames.indexOf(username), 1);
      if (this.owner === username && !this.isEmpty()) {
        this.setOwner(this.usernames[0]);
      }
      return true;
    } else {
      return false;
    }
  }

  // TODO
  addBot() { }
  removeBot() { }

  // Game related
  isInGame() { return this.game !== null; }

  getGameInfo() {
    return this.game.getGameboardInfo();
  }

  getPlayersData() {
    return this.game.playersData;
  }

  // If action is passed, transform then return the buffer
  // Otherwise, return the buffer directly
  resolveAction(action) {
    if (action !== null) {
      this.game.transform(action);
    }
    return this.game.getOptionsBuffer();
  }

  // Return the option generated for the 1st player
  startGame() {
    if (this.isFull() && !this.isInGame()) {
      this.game = new Game({
        maxPlayers: this.maxPlayers,
        endRoundWind: winds.SOUTH, // TODO: More on this later
        usernames: [...this.usernames],
        botnames: [...this.botnames],
      });
      this.game.init();
      return true;
    } else {
      return false;
    }
  }
}

module.exports = Room;