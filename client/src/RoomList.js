import React from 'react';

import { messageTypes } from './constants';

class RoomList extends React.Component {
  // props: loggedUser, onlineRooms, onlineUsers, helper funcs
  constructor(props) {
    super(props);
    this.state = {
      newRoomname: '',
      newMaxPlayers: 4
    };
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
    if (this.state.newRoomname === '') {
      console.log('Room name cannot be empty');
    } else if (this.props.onlineRooms.some(r =>
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

  handleJoinRoom = roomname => {
    let room = this.props.onlineRooms.find(r => r.roomname === roomname);
    if (room.usernames.length + room.botnames.length < room.maxPlayers) {
      this.props.sendMessage(messageTypes.PULL_JOIN_ROOM, {
        roomname: room.roomname
      });
    } else {
      console.log('Room is full');
    }
  }

  render() {
    console.log('RoomList rendered');

    const roomList = this.props.onlineRooms.map((r, i) =>
      <li key={i}>
        <span>
          <strong>{r.roomname} </strong>
          {`${r.usernames.length + r.botnames.length}/${
            r.maxPlayers} owner: ${r.owner} members: ${
            r.usernames.join()} `}
        </span>
        <button onClick={this.handleJoinRoom.bind(this, r.roomname)}>
          Join</button>
      </li>);

    const userList = this.props.onlineUsers.map((u, i) => <li key={i}>{
      `${u.username} ${u.roomname ?
        'room: ' + u.roomname : 'out of room'}`
    }</li>);

    return (
      <div style={{ margin: '10% 20%' }}>
        <h1>Hi, {this.props.loggedUser}! <button
          onClick={this.props.handleLogout}>Log out</button></h1>
        <h4>Create or join a gaming room to play</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h4>Current rooms</h4>
            <ul style={{ listStyleType: 'none' }}>{roomList}</ul>
            <form>
              <input type='text' name='newRoomname'
                placeholder='roomname, A-Za-z only'
                onChange={this.onChangeText} value={this.state.newRoomname} />
              <input type='radio' id='4p' name='newMaxPlayers'
                value='4' checked={this.state.newMaxPlayers === 4}
                onChange={this.onChangeRadio} />
              <label htmlFor='4p'>4 players</label>
              <input type='radio' id='3p' name='newMaxPlayers'
                value='3' checked={this.state.newMaxPlayers === 3}
                onChange={this.onChangeRadio} disabled />
              <label htmlFor='3p'>3 players</label>
              <button onClick={this.handleCreateRoom}>Create a new room!</button>
            </form>
          </div>
          <div>
            <h4>Online users</h4>
            <ul style={{ listStyleType: 'none' }}>{userList}</ul>
          </div>
        </div>
      </div>

    );
  }
}

export default RoomList;