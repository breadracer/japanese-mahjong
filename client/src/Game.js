import React from 'react';

class Game extends React.Component {
  // props:
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    // TODO
    return true;
  }

  render() {
    console.log('Game rendered');
    return (
      <div>
        <h1>Welcome to the game page, {this.props.loggedUser}.</h1>
        <p>{this.props.game}</p>
      </div>
    )
  }
}

export default Game;