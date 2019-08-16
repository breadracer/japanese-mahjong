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
    let playersList = this.props.playersData.map((player, i) => (
      <div key={i}>
        <h5>{player.name}'s data:</h5>
        <p>Score: {player.score}</p>
        <p>Seatwind: {player.seatWind}</p>
        <p>Hand: {tilesToStringSorted(player.hand)}</p>
        {/* <p>Drawn tile: {tilesToString([player.drawnTile])}</p> */}
        <p>Discard pile: {tilesToString(player.discardPile)}</p>
      </div>
    ));
    return (
      <div>
        <div>
          <h1>Welcome to the game page, {this.props.loggedUser}.</h1>
          <h5>liveWall:</h5>
          <p>{tilesToString(this.props.liveWall)}</p>
          <h5>deadWall:</h5>
          <p>{tilesToString(this.props.deadWall)}</p>
        </div>
        <hr />
        {playersList}
      </div>
    )
  }
}

// Temporary helper functions

// For walls
function tilesToString(tiles) {
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
function tilesToStringSorted(tiles) {
  let sortedTiles = [...tiles].sort((x, y) => x < y ? -1 : x > y ? 1 : 0);
  let tilesStrings = ['', '', '', ''];
  let tileTypesStrings = ['m', 'p', 's', 'j'];
  sortedTiles.forEach(tile => {
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