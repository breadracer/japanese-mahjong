class Session {
  constructor(username, socket, isAlive = true, roomname = null) {
    this.username = username;
    this.socket = socket;
    this.isAlive = isAlive;
    this.roomname = roomname;
  }

  getIsAlive() { return this.isAlive; }
  setIsAlive(isAlive) { this.isAlive = isAlive; }

  pingSocket() { this.socket.ping(() => { }); }
  terminateSocket() { this.socket.terminate(); }

  sendMessage(type, message) {
    this.socket.send(JSON.stringify({ type, message }));
  }

  enterRoom(roomname) {
    if (!this.roomname) {
      this.roomname = roomname;
      return true;
    } else {
      return false;
    }
  }

  leaveRoom() {
    if (this.roomname) {
      this.roomname = null;
      return true;
    } else {
      return false;
    }
  }
}

module.exports = Session;