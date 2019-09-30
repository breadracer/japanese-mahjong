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

  handleAddBot = e => {
    e.preventDefault();
    if (this.props.inRoomUsers.length +
      this.props.inRoomBots.length >=
      this.props.maxPlayers) {
      console.log('Your room is already full');
    } else {
      this.props.sendMessage(messageTypes.PULL_ADD_BOT, {
        roomname: this.props.roomname,
        // Note: The passed in botType is essentially the botname
        botType: this.state.newBotType
      });
      this.setState({ newBotType: botTypes.EASY });
    }
  };

  handleRemoveBot = botname => {
    // Assume botname exists
    this.props.sendMessage(messageTypes.PULL_REMOVE_BOT, {
      roomname: this.props.roomname, botname
    });
  };

  render() {
    console.log('Room rendered');
    const userList = this.props.inRoomUsers.map((u, i) => (
      u === this.props.owner ?
        <li key={i + 4}><strong>{u}</strong></li> :
        <li key={i + 4}>{u}</li>));

    const botList = this.props.inRoomBots.map((b, i) =>
      <li key={i}>{`${b} (BOT)  `}{
        this.props.loggedUser === this.props.owner ?
          <button onClick={this.handleRemoveBot.bind(this, b)}>Remove</button>
          : null
      }</li>);

    const startButton = this.props.loggedUser !== this.props.owner ? null :
      this.props.inRoomUsers.length + this.props.inRoomBots.length !==
        this.props.maxPlayers ? null : <button
          onClick={this.handleStartGame}> Start game</button>;

    let botTypeList = Object.entries(botTypes);

    const botFormInputs = this.props.loggedUser === this.props.owner ?
      <form>
        {botTypeList.map((botType, i) => (
          <div key={i}>
            <input type='radio' id={botType[0]} name='newBotType'
              value={botType[1]} checked={this.state.newBotType === botType[1]}
              onChange={this.onChangeRadio} />
            <label htmlFor={botType[0]}>{botType[0]}</label>
          </div>
        ))}
        <button onClick={this.handleAddBot}>Add a new PC player!</button>
      </form> : null;

    return (
      <div style={{ margin: '10% 20%' }}>
        <h1>You are inside the room, {this.props.loggedUser}. <button
          onClick={this.props.handleLogout}>Log out</button></h1>
        <h4>Room: {this.props.roomname} <button
          onClick={this.handleExitRoom}>Exit room</button>
          {startButton}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ width: '50%' }}>
            {botFormInputs}
          </div>
          <div style={{ width: '50%' }}>
            <h4>Current players: ({
              this.props.inRoomUsers.length + this.props.inRoomBots.length
            }/{this.props.maxPlayers})</h4>
            <ul style={{ listStyleType: 'none' }}>
              {[...userList, ...botList]}</ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Room;