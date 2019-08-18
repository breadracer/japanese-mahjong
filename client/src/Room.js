import React from 'react';
import { messageTypes, botTypes } from './constants';

class Room extends React.Component {
  // props: loggedUser, roomname, inRoomUsers, maxPlayers, owner, helper funcs
  constructor(props) {
    super(props);
    this.state = {
      newBotType: botTypes.EASY
    };
  }

  shouldComponentUpdate(nextProps) {
    // TODO
    return true;
  }

  onChangeRadio = e => {
    this.setState({ newBotType: e.currentTarget.value });
  };

  handleExitRoom = () => {
    this.props.sendMessage(messageTypes.PULL_EXIT_ROOM, {
      roomname: this.props.roomname
    });
  };

  handleStartGame = () => {
    this.props.sendMessage(messageTypes.PULL_START_GAME, {
      roomname: this.props.roomname,
      maxPlayers: this.props.maxPlayers
      // TODO: More configurations later
    });
  };

  // TODO
  handleAddBot = e => {
    e.preventDefault();
    if (this.props.inRoomUsers.length +
      this.props.inRoomBots.length >=
      this.props.maxPlayers) {
      console.log('Your room is already full');
    } else {
      this.props.sendMessage(messageTypes.PUSH_ADD_BOT, {
        roomname: this.props.roomname,
        botType: this.state.newBotType
      });
      this.setState({ newBotType: botTypes.EASY });
    }
  };

  // TODO
  handleRemoveBot = () => {

  };

  render() {
    console.log('Room rendered');
    const userList = this.props.inRoomUsers.map((u, i) => (
      u === this.props.owner ?
        <li key={i}><strong>{u}</strong></li> :
        <li key={i}>{u}</li>));

    const startButton = this.props.loggedUser === this.props.owner ?
      <button onClick={this.handleStartGame}>Start game</button> : null;

    let botTypeList = Object.values(botTypes);

    const botFormInputs = this.props.loggedUser === this.props.owner ?
      <form>
        {botTypeList.map((botType, i) => (
          <div key={i}>
            <input type='radio' id={botType} name='newBotType'
              value={botType} checked={this.state.newBotType === botType}
              onChange={this.onChangeRadio} />
            <label htmlFor={botType}>{botType}</label>
          </div>
        ))}
        <button onClick={this.handleAddBot}>Add a new PC player!</button>
      </form> : null;

    return (
      <div>
        <h1>Welcome to the room page, {this.props.loggedUser}.</h1>
        <div>
          <button onClick={this.props.handleLogout}>Log out</button>
        </div>
        <div>
          <div>
            <h4>Room: {this.props.roomname}</h4>
            {startButton}
            <button onClick={this.handleExitRoom}>Exit room</button>
          </div>
          {botFormInputs}
          <div>
            <h4>Current players: ({
              this.props.inRoomUsers.length}/{this.props.maxPlayers})</h4>
            <ul>{userList}</ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Room;