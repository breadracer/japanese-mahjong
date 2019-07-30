import React from 'react';
import axios from 'axios';

import { constants, userStatus, messageTypes } from './constants';
import RoomList from './RoomList';
import Room from './Room';
import Game from './Game';

export default class Gameboard extends React.Component {
  // props: socket, logged username

  constructor(props) {
    super(props);
    this.state = {
      // User information: (username is in props)
      status: userStatus.OUT_ROOM,

      // Display game world information:
      // index page (OUT_ROOM)
      onlineRooms: [], // Room: roomname, room size, current # of players, owner
      onlineUsers: [], // User: username

      // In-room page (IN_ROOM)
      roomname: null,
      inRoomUsers: [], // User: username
      isOwner: false,
      chatInput: '',
      chatRoom: [],

      // Game page (IN_GAME)

    };

    // Set the onmessage event handler
    this.props.socket.onmessage = this.handleReceiveMessage;
  }


  handleReceiveMessage = event => {
    let data = JSON.parse(event.data);
    console.log(data);
    switch (data.type) {
      case messageTypes.PUSH_USER_CONNECT: {
        return this.setState(prevState => ({
          onlineUsers: [...prevState.onlineUsers, data.message.newUser]
        }));
      }
      case messageTypes.PUSH_USER_DISCONNECT: {
        return this.setState(prevState => ({
          onlineUsers: prevState.onlineUsers.filter(u => 
            u.username !== data.message.removedUser.username)
        }));
      }
      case messageTypes.PUSH_ALL_ROOMS: {
        return this.setState({ onlineRooms: [...data.message.onlineRooms] });
      }
      case messageTypes.PUSH_ALL_USERS: {
        return this.setState({ onlineUsers: [...data.message.onlineUsers] });
      }
      default: {
        console.log('Invalid message type');
      }
    }
    // this.setState(prevState => ({
    //   chatRoom: [...prevState.chatRoom, JSON.parse(event.data).message]
    // }));
  }

  sendMessage = (type, message) => {
    this.props.socket.send(JSON.stringify({ type, message }));
  }

  // handleSendMessage = e => {
  //   e.preventDefault();
  //   this.props.socket.send(this.state.chatInput);
  //   this.setState({ chatInput: '' });
  // }

  // handleTestSpeed = _ => {
  //     this.props.socket.send(Date.now());
  // };

  handleLogout = () => {
    axios.post(`http://${constants.HOST_NAME}:8000/api/logout`, {
      username: this.props.loggedUser,
    }, {
        headers: {
          'Cross-Domain': true,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => {
        console.log(res.data);
        this.props.socket.close();
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 ' +
          '00:00:01 GMT; path=/'
        document.cookie = 'session_user=; expires=Thu, 01 Jan ' +
          '1970 00:00:01 GMT; path=/';
      }).catch(err => {
        console.log(err);
      });
  }

  render() {
    switch (this.state.status) {
      case userStatus.OUT_ROOM:
        return <RoomList
          loggedUser={this.props.loggedUser}
          onlineRooms={this.state.onlineRooms}
          onlineUsers={this.state.onlineUsers}
          handleLogout={this.handleLogout}
          sendMessage={this.sendMessage}
        />;
      case userStatus.IN_ROOM:
        return <Room
          loggedUser={this.props.loggedUser}
          sendMessage={this.sendMessage}
        />;
      case userStatus.IN_GAME:
        return <Game
          loggedUser={this.props.loggedUser}
          sendMessage={this.sendMessage}
        />;
      default:
        return <h5>Unknown user status</h5>;
    }

    // const messageList = this.state.chatRoom.map(
    //   (e, i) => <p key={i}>{e}</p>);
    // return (
    //   <div>
    //     <div>
    //       <button onClick={this.handleLogout}>Log out</button>
    //       {/* <button onClick={this.handleTestSpeed}>Get ws time</button> */}
    //     </div>
    //     <div>
    //       {messageList}
    //     </div>
    //     <form>
    //       <input type='text' onChange={this.onChange}
    //         name='chatInput' value={this.state.chatInput} />
    //       <button onClick={this.handleSendMessage}>Send</button>
    //     </form>
    //   </div>
    // )
  }
}