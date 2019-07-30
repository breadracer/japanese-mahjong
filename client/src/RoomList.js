import React from 'react';

class RoomList extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    // TODO: Determine whether to re-render base on props exact equality
    return true;
  }

  render() {
    const roomList = this.props.onlineRooms.map((r, i) =>
      <li key={i}>
        <strong>{r.roomname}</strong> {r.numPlayers}/{r.maxPlayers}
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