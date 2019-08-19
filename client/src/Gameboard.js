import React from 'react';
import axios from 'axios';

import { constants, userStatus, messageTypes } from './constants';
import RoomList from './RoomList';
import Room from './Room';
import Game from './Game';

class Gameboard extends React.Component {
  // props: socket, loggedUser

  constructor(props) {
    super(props);
    this.state = {
      // User information: (username is in props)
      status: userStatus.OUT_ROOM,

      // Display game world information:
      // index page (OUT_ROOM)
      onlineRooms: [], // Room: roomname, room size, current # of players, owner
      onlineUsers: [], // User: username, roomname

      // In-room page and In-game page (IN_ROOM, IN_GAME)
      roomname: null,
      inRoomUsers: [], // User: username
      inRoomBots: [], // Bot: botname
      maxPlayers: null,
      owner: null,

      // In-game page (IN_GAME)

      // TODO: Filter out some of the game data later
      // Game data
      roundWind: 0,
      roundWindCounter: 0,
      liveWall: [],
      deadWall: [],
      kanCounter: 0,
      turnCounter: 0,
      // name, isBot, seatWind, hand (array), discardPile (array), score
      playersData: [],

      // Player self data
      seatWind: 0,
      options: [],
    };

    // Set the onmessage event handler
    this.props.socket.onmessage = this.handleReceiveMessage;
  }


  handleReceiveMessage = event => {
    let { type, message } = JSON.parse(event.data);
    console.log('Received:', event.data);
    switch (type) {
      case messageTypes.PUSH_USER_CONNECT: {
        return this.setState(prevState => ({
          onlineUsers: [...prevState.onlineUsers, message.newUser]
        }));
      }

      // If user in-room, also need to remove the user from the room
      // Note: Disconnection of a user does not impact a room's bots
      case messageTypes.PUSH_USER_DISCONNECT: {
        return this.setState(prevState => {
          let { username, roomname } = message.removedUser;

          // If disconnected user is in-room
          if (roomname) {
            let prevRooms = [...prevState.onlineRooms];
            let { usernames, owner } = message.updatedRoom;

            if (usernames.length !== 0) {
              // If that room is not empty
              let room = prevRooms.find(r => r.roomname === roomname);
              if (room) {
                room.usernames = usernames;
                room.owner = owner;
                // For users in the same room, game not started
                if (this.state.status === userStatus.IN_ROOM &&
                  this.state.roomname === roomname) {
                  return {
                    onlineUsers: prevState.onlineUsers.filter(u =>
                      u.username !== username),
                    onlineRooms: prevRooms,
                    inRoomUsers: usernames,
                    owner: owner
                  };
                  // For users in the same room, game started
                } else if (this.state.status === userStatus.IN_GAME &&
                  this.state.roomname === roomname) {

                  // TODO: In-game user quit, change it to robot
                  return {
                    onlineUsers: prevState.onlineUsers.filter(u =>
                      u.username !== username),
                    onlineRooms: prevRooms,
                    inRoomUsers: usernames,
                    // TODO: More on this later
                    // inRoomBots: [...prevState.inRoomBots, username],
                    owner: owner
                  }

                  // For all other users
                } else {
                  return {
                    onlineUsers: prevState.onlineUsers.filter(u =>
                      u.username !== username),
                    onlineRooms: prevRooms
                  };
                }
              } else {
                console.log('Error: synchronization error');
              }
            } else {
              // If that room is empty, remove that room
              return {
                onlineUsers: prevState.onlineUsers.filter(u =>
                  u.username !== username),
                onlineRooms: prevRooms.filter(r => r.roomname !== roomname)
              };
            }
          } else {
            // If disconnected user is out-room
            return {
              onlineUsers: prevState.onlineUsers.filter(u =>
                u.username !== username)
            };
          }
        });
      }

      case messageTypes.PUSH_ALL_ROOMS: {
        return this.setState({ onlineRooms: [...message.onlineRooms] });
      }

      case messageTypes.PUSH_ALL_USERS: {
        return this.setState({ onlineUsers: [...message.onlineUsers] });
      }

      // Create a new room and let the owner join the new room
      case messageTypes.PUSH_CREATE_ROOM: {
        if (message.isValid) {
          let { owner, roomname, maxPlayers, usernames } = message.newRoom;
          this.setState(prevState => {
            let prevUsers = [...prevState.onlineUsers];
            let user = prevUsers.find(u => u.username === owner);
            // Validate that the owner is online, and let the owner join
            if (user) {
              user.roomname = message.newRoom.roomname;
              // For pulled user
              if (user.username === this.props.loggedUser) {
                return {
                  status: userStatus.IN_ROOM,
                  onlineRooms: [...prevState.onlineRooms, message.newRoom],
                  onlineUsers: [...prevUsers],
                  roomname,
                  inRoomUsers: usernames,
                  inRoomBots: [], // Assume initially there is no bot
                  maxPlayers,
                  owner
                }
                // For all others
              } else {
                return {
                  onlineRooms: [...prevState.onlineRooms, message.newRoom],
                  onlineUsers: [...prevUsers]
                };
              }
            } else {
              console.log('Error: owner of the new room is offline');
              return {};
            }
          });
        }
        return;
      }

      case messageTypes.PUSH_JOIN_ROOM: {
        if (message.isValid) {
          let { roomname, usernames, botnames,
            maxPlayers, owner } = message.updatedRoom;
          let { username } = message.updatedUser;
          this.setState(prevState => {
            let prevRooms = [...prevState.onlineRooms];
            let prevUsers = [...prevState.onlineUsers];
            let room = prevRooms.find(r => r.roomname === roomname);
            let user = prevUsers.find(u => u.username === username);
            // Validate that the target user and room exist
            if (room && user) {
              room.usernames = [...usernames];
              user.roomname = roomname;
              // For pulled user
              if (username === this.props.loggedUser) {
                return {
                  status: userStatus.IN_ROOM,
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers],
                  roomname,
                  inRoomUsers: usernames,
                  inRoomBots: botnames,
                  maxPlayers,
                  owner
                };
                // For other users in the same room
              } else if (this.state.status === userStatus.IN_ROOM &&
                roomname === this.state.roomname) {
                return {
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers],
                  inRoomUsers: usernames,
                }
                // For all others
              } else {
                return {
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers]
                };
              }
            } else {
              console.log('Error: user or room does not exist');
              return {};
            }
          });
        }
        return;
      }

      case messageTypes.PUSH_EXIT_ROOM: {
        if (message.isValid) {
          let { usernames, owner, roomname } = message.updatedRoom;
          let { username } = message.updatedUser;
          this.setState(prevState => {
            let prevRooms = [...prevState.onlineRooms];
            let prevUsers = [...prevState.onlineUsers];
            let room = prevRooms.find(r => r.roomname === roomname);
            let user = prevUsers.find(u => u.username === username);
            // Validate that the target user and room exist
            if (room && user) {
              room.usernames = usernames;
              room.owner = owner;
              user.roomname = null;
              // If room is empty after leaving, remove the room
              if (room.usernames.length === 0) {
                prevRooms = prevRooms.filter(r => r.roomname !== roomname);
              }
              // For pulled user
              if (username === this.props.loggedUser) {
                return {
                  status: userStatus.OUT_ROOM,
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers],
                  roomname: null,
                  inRoomUsers: [],
                  maxPlayers: null,
                  owner: null,
                };
                // For other users in the same room
              } else if (this.state.status === userStatus.IN_ROOM &&
                roomname === this.state.roomname) {
                return {
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers],
                  inRoomUsers: usernames,
                  owner
                };
                // For all others
              } else {
                return {
                  onlineRooms: [...prevRooms],
                  onlineUsers: [...prevUsers]
                };
              }
            } else {
              console.log('Error: user or room does not exist');
              return {};
            }
          });
        }
        return;
      }

      // These two push messages essentially do the same thing
      case messageTypes.PUSH_ADD_BOT:
      case messageTypes.PUSH_REMOVE_BOT: {
        if (message.isValid) {
          let { roomname, botnames } = message.updatedRoom;
          this.setState(prevState => {
            let prevRooms = [...prevState.onlineRooms];
            let room = prevRooms.find(r => r.roomname === roomname);
            // Validate that the target room exist
            if (room) {
              room.botnames = [...botnames];
              // For users in the same room
              if (this.state.status === userStatus.IN_ROOM &&
                roomname === this.state.roomname) {
                return {
                  onlineRooms: [...prevRooms],
                  inRoomBots: botnames
                }
                // For all others
              } else {
                return { onlineRooms: [...prevRooms] };
              }
            } else {
              console.log('Error: room does not exist');
              return {};
            }
          });
        }
        return;
      }

      case messageTypes.PUSH_START_GAME: {
        if (message.isValid) {
          let { roomname } = message.updatedRoom;
          this.setState(prevState => {
            let prevRooms = [...prevState.onlineRooms];
            let room = prevRooms.find(r => r.roomname === roomname);
            if (room) {
              room.isInGame = true;
              // For all others
              return { onlineRooms: [...prevRooms] };
            } else {
              console.log('Error: room does not exist');
              return {};
            }
          });
        }
        return;
      }

      case messageTypes.PUSH_UPDATE_GAME: {
        // TODO: More on this later
        if (message.isValid) {
          let { roomname, game, seatWind, options } = message;
          let playersData = game.playersData;
          let { liveWall, deadWall, kanCounter, turnCounter } = game.roundData;
          let { roundWind, roundWindCounter } = game.globalData;
          // For users in the target room
          if ((this.state.status === userStatus.IN_ROOM ||
            this.state.status === userStatus.IN_GAME) &&
            this.state.roomname === roomname) {
            this.setState({
              status: userStatus.IN_GAME,
              liveWall,
              deadWall,
              playersData,
              kanCounter,
              turnCounter,
              roundWind,
              roundWindCounter,
              seatWind,
              options
            });
          } else {
            console.log('Error: message delivered to the wrong destination');
          }
        }
        return;
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
    let payload = JSON.stringify({ type, message });
    console.log('Sent:', payload);
    this.props.socket.send(payload);
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
          '00:00:01 GMT; path=/';
        document.cookie = 'session_user=; expires=Thu, 01 Jan ' +
          '1970 00:00:01 GMT; path=/';
      }).catch(err => {
        console.log(err);
      });
  }

  render() {
    console.log('Gameboard rendered');
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
          roomname={this.state.roomname}
          inRoomUsers={this.state.inRoomUsers}
          inRoomBots={this.state.inRoomBots}
          maxPlayers={this.state.maxPlayers}
          owner={this.state.owner}
          handleLogout={this.handleLogout}
          sendMessage={this.sendMessage}
        />;
      case userStatus.IN_GAME:
        return <Game
          loggedUser={this.props.loggedUser}
          roomname={this.state.roomname}
          game={this.state.game}

          liveWall={this.state.liveWall}
          deadWall={this.state.deadWall}
          roundWind={this.state.roundWind}
          roundWindCounter={this.state.roundWindCounter}
          kanCounter={this.state.kanCounter}
          turnCounter={this.state.turnCounter}
          playersData={this.state.playersData}

          seatWind={this.state.seatWind}
          options={this.state.options}

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

export default Gameboard;