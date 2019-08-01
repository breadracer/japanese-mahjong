import React from 'react';

import { messageTypes } from './constants';

class RoomList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newRoomname: '',
      newMaxPlayers: 4
    }
  }

  shouldComponentUpdate(nextProps) {
    // TODO: Determine whether to re-render base on props exact equality
    return true;
  }

  onChangeText = e => { this.setState({ [e.target.name]: e.target.value }); }

  onChangeRadio = e => {
    this.setState({ newMaxPlayers: parseInt(e.currentTarget.value) });
  }

  handleCreateRoom = e => {
    e.preventDefault();
    if (this.props.onlineRooms.some(r =>
      r.roomname === this.state.newRoomname)) {
        console.log('Room name already occupied');
    } else {
      this.props.sendMessage(messageTypes.PULL_CREATE_ROOM, {
        roomname: this.state.newRoomname,
        maxPlayers: this.state.newMaxPlayers
      });
      this.setState({ newRoomname: '', newMaxPlayers: 4 });
    }
  }

  render() {
    const roomList = this.props.onlineRooms.map((r, i) =>
      <li key={i}>
        <strong>{r.roomname}</strong> {r.usernames.length}/{r.maxPlayers}
      </li>);
    const userList = this.props.onlineUsers.map((u, i) =>
      <li key={i}>{u.username}</li>);
    return (
      <div>
        <h1>Welcome to the roomlist page!</h1>
        <div>
          <button onClick={this.props.handleLogout}>Log out</button>
          {/* <button onClick={this.handleTestSpeed}>Get ws time</button> */}
        </div>
        <div>
          <h4>Current rooms</h4>
          <ul>{roomList}</ul>
          <form>
            <input type='text' placeholder='roomname' name='newRoomname'
              onChange={this.onChangeText} value={this.state.newRoomname} />
            <input type='radio' id='4p' name='newMaxPlayers'
              value='4' checked={this.state.newMaxPlayers === 4}
              onChange={this.onChangeRadio} />
            <label htmlFor='4p'>4 players</label>
            <input type='radio' id='3p' name='newMaxPlayers'
              value='3' checked={this.state.newMaxPlayers === 3}
              onChange={this.onChangeRadio} />
            <label htmlFor='3p'>3 players</label>
            <button onClick={this.handleCreateRoom}>Create a new room!</button>
          </form>
        </div>
        <div>
          <h4>Online users</h4>
          <ul>{userList}</ul>
        </div>
      </div>

    );
  }
}

export default RoomList;