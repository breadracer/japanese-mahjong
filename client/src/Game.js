import React from 'react';
import { actionTypes, messageTypes } from './constants';

class Game extends React.Component {
  // props:
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    // TODO
    return true;
  }

  handleDiscard = tile => {
    // Assume the discard is valid
    this.props.sendMessage(messageTypes.PULL_UPDATE_GAME, {
      roomname: this.props.roomname,
      action: {
        type: actionTypes.ACTION_DISCARD,
        seatWind: this.props.seatWind,
        data: { tile }
      }
    });
  }

  render() {
    console.log('Game rendered');

    // Temporary option selectors
    let discardOptionList = null;
    let discardOption = this.props.options.filter(option =>
      option.type === actionTypes.OPTION_DISCARD)[0];
    if (discardOption !== undefined) {
      let { data } = discardOption;
      let playerSelf = this.props.playersData[this.props.seatWind];
      let discardables = [...playerSelf.hand, playerSelf.drawnTile].filter(
          tile => !data.forbiddenTiles.includes(tile));
      discardOptionList = <div>
        {discardables.map((tile, i) =>
          <button key={i} onClick={this.handleDiscard.bind(this, tile)}>
            {tilesToStringWall([tile])}
          </button>
        )}</div>;
    }


    let playersList = <div style={{ display: 'flex' }}>
      {this.props.playersData.map((player, i) => (
        <div key={i} style={{ flex: 1 }}>
          <h5>{player.name}'s data:</h5>
          <p>Score: {player.score}</p>
          <p>Seatwind: {player.seatWind}</p>
          <p>Hand: {tilesToStringHand(player.hand)}</p>
          <p>Drawn tile: {player.drawnTile !== null ?
            tilesToStringWall([player.drawnTile]) : null}</p>
          <p>Discard pile: {tilesToStringWall(player.discardPile)}</p>
          {this.props.seatWind === i ? discardOptionList : null}
        </div>
      ))}
    </div>

    return (
      <div style={{ margin: '50px' }}>
        <div>
          <h1>Welcome to the game page, {this.props.loggedUser}.</h1>
          <div style={{ display: 'flex' }}>
            <div>
              <h5>liveWall:</h5>
              <p>{tilesToStringWall(this.props.liveWall)}</p>
            </div>
            <div>
              <h5>deadWall:</h5>
              <p>{tilesToStringWall(this.props.deadWall)}</p>
            </div>
          </div>
        </div>
        <hr />
        {playersList}
      </div>
    )
  }
}

// Temporary helper functions

// For walls
function tilesToStringWall(tiles) {
  let tilesStrings = [];
  let tileTypesStrings = ['m', 'p', 's', 'j'];
  tiles.forEach(tile => {
    let suitType = Math.floor(tile / 36);
    let suitNum = Math.floor((tile % 36) / 4);
    tilesStrings.push(String(suitNum + 1) + tileTypesStrings[suitType]);
  });
  return tilesStrings.join(' ');
}

// For hands
function tilesToStringHand(tiles) {
  let tilesStrings = ['', '', '', ''];
  let tileTypesStrings = ['m', 'p', 's', 'j'];
  tiles.forEach(tile => {
    let suitType = Math.floor(tile / 36);
    let suitNum = Math.floor((tile % 36) / 4);
    tilesStrings[suitType] += String(suitNum + 1);
  });
  tilesStrings.forEach((str, i) => {
    if (str !== '') {
      tilesStrings[i] += tileTypesStrings[i];
    }
  });
  return tilesStrings.join('');
}

export default Game;