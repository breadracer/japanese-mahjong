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
    let data = JSON.stringify({ type, message }), dataLog;
    if (type === 'PUSH_UPDATE_GAME') {
      let { game, seatWind, options } = message;
      let { optionsBuffer, callOptionWaitlist, roundData } = game;
      let { turnCounter, callTriggerTile } = roundData;
      dataLog = JSON.stringify({
        type, message: {
          turnCounter, callTriggerTile, seatWind,
          options, optionsBuffer, callOptionWaitlist
        }
      });
    } else {
      dataLog = JSON.stringify({ type, message });
    }
    console.log(`Send ${dataLog} to ${this.username}`);
    this.socket.send(data);
  }

  isInRoom() { return !!this.roomname; }

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