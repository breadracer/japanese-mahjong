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

  // Note: The passed in botType is essentially the botname
  hasBot(botname) { return this.botnames.includes(botname); }

  addBot(botname) {
    if (!this.isFull()) {
      this.botnames.push(botname);
      return true;
    } else {
      return false;
    }
  }

  removeBot(botname) {
    if (this.hasBot(botname)) {
      this.botnames.splice(this.botnames.indexOf(botname), 1);
      return true;
    } else {
      return false;
    }
  }

  // Game related
  isInGame() { return this.game !== null; }

  // Return the option generated for the 1st player
  startGame() {
    if (!this.isFull() || this.isInGame()) {
      return false;
    }
    this.game = new Game({
      maxPlayers: this.maxPlayers,
      endRoundWind: winds.SOUTH, // TODO: More on this later
      usernames: [...this.usernames],
      botnames: [...this.botnames],
    });
    this.game.init();
    return true;
  }

  endGame() {
    if (!this.isInGame()) {
      return false;
    }
    this.game = null;
    return true;
  }
}

module.exports = Room;