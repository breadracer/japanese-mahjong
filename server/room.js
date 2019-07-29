class Room {
  constructor(roomname, maxPlayers) {
    this.roomname = roomname;
    this.maxPlayers = maxPlayers;
    this.usernames = [];
    this.owner = null;
    this.game = null;
  }

  isFull() { return this.usernames.length === this.maxPlayers; }
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
}

module.exports = Room;