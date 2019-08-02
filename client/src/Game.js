import React from 'react';

class Game extends React.Component {
  render() {
    return <h1>Welcome to the game page, {this.props.loggedUser}.</h1>
  }
}

export default Game;