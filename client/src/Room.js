import React from 'react';
import { messageTypes } from './constants';

class Room extends React.Component {
  constructor(props) {
    super(props);
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  handleExitRoom = () => {
    this.props.sendMessage(messageTypes.PULL_EXIT_ROOM, {
      roomname: this.props.roomname
    });
  }

  render() {
    console.log('Room rendered')
    const userList = this.props.inRoomUsers.map((u, i) => (
      u === this.props.owner ?
        <li key={i}><strong>{u}</strong></li> :
        <li key={i}>{u}</li>));
    return (
      <div>
        <h1>Welcome to the room page, {this.props.loggedUser}.</h1>
        <div>
          <button onClick={this.props.handleLogout}>Log out</button>
        </div>
        <div>
          <div>
            <h4>Room: {this.props.roomname}</h4>
            <button onClick={this.handleExitRoom}>Exit room</button>
          </div>
          <div>
            <h4>Current players: ({
              this.props.inRoomUsers.length}/{this.props.maxPlayers})</h4>
            <ul>{userList}</ul>
          </div>
        </div>
      </div>
    )
  }
}

export default Room;