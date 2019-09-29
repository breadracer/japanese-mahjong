import React from 'react';
import {
  actionTypes, messageTypes, optionStatus,
  gameStatus, tileTypes, redDoraTileValues
} from './constants';

class Game extends React.Component {
  // props:
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    // TODO
    return true;
  }

  handleAction = (type, data) => {
    this.props.sendMessage(messageTypes.PULL_UPDATE_GAME, {
      roomname: this.props.roomname,
      action: { type, data, seatWind: this.props.seatWind }
    });
  };

  handleEndGame = () => {

  };

  render() {
    console.log('Game rendered');
    switch (this.props.gameStatus) {
      case gameStatus.IN_PROGRESS: {
        // Temporary option selectors
        let discardOptionList = null;
        let discardOption = this.props.options.filter(option =>
          option.type === actionTypes.OPTION_DISCARD)[0];
        if (discardOption !== undefined) {
          let { data } = discardOption;
          let playerSelf = this.props.playersData[this.props.seatWind];
          let discardables = [...playerSelf.hand, playerSelf.drawnTile].filter(
            tile => tile !== null && !data.forbiddenTiles.includes(tile));
          discardOptionList = <div>
            {discardables.map((tile, i) =>
              <button key={i} onClick={this.handleAction.bind(
                this, actionTypes.ACTION_DISCARD, { tile }
              )}>{tilesToStringWall([tile])}</button>)}
          </div>;
        }

        let nonDiscardOptions = this.props.options.filter(option =>
          option.type !== actionTypes.OPTION_DISCARD &&
          option.status === optionStatus.PENDING);
        // If there is any call options (no discard option),
        // add a skip button at the end
        if (discardOptionList === null && nonDiscardOptions.length !== 0) {
          nonDiscardOptions.push(null);
        }
        let nonDiscardOptionList = <div><ul style={{ listStyleType: 'none' }}>
          {nonDiscardOptions.map((option, i) => {
            let callTriggerTile = this.props.callTriggerTile;
            // For the pre-allocated skip button
            if (option === null) {
              return <li key={i}><button onClick={this.handleAction.bind(
                this, actionTypes.ACTION_SKIP_CALL, null)}>SKIP</button></li>
            }
            switch (option.type) {
              case actionTypes.OPTION_KAN_OPEN_DRAW:
                return <li key={i}>{
                  option.data.candidateInfo.map((candidate, j) =>
                    <button key={j} onClick={this.handleAction.bind(
                      this, optionToActionType(option.type), {
                        acceptedCandidateInfo: candidate
                      })}>KAN {
                        tilesToStringWall([
                          ...this.props.playersData[this.props.seatWind].tileGroups[
                            candidate.groupIndex].tiles, candidate.tile
                        ])
                      }</button>)}</li>;

              case actionTypes.OPTION_KAN_CLOSED:
                return <li key={i}>{
                  option.data.candidateTiles.map((group, j) =>
                    <button key={j} onClick={this.handleAction.bind(
                      this, optionToActionType(option.type), {
                        acceptedCandidate: group
                      })}>KAN {
                        tilesToStringWall(group)
                      }</button>)}</li>;

              case actionTypes.OPTION_RIICHI: return null;
              case actionTypes.OPTION_TSUMO: return null;

              case actionTypes.OPTION_CHII:
                return <li key={i}>{
                  option.data.candidateTiles.map((group, j) =>
                    <button key={j} onClick={
                      this.handleAction.bind(
                        this, optionToActionType(option.type), {
                          acceptedCandidate: group,
                          triggerTile: callTriggerTile
                        })}>CHII {
                        tilesToStringWall([...group, callTriggerTile])
                      }</button>)}</li>;

              case actionTypes.OPTION_PON:
                return <li key={i}>{
                  option.data.candidateTiles.map((group, j) =>
                    <button key={j} onClick={this.handleAction.bind(
                      this, optionToActionType(option.type), {
                        acceptedCandidate: group,
                        triggerTile: callTriggerTile
                      })}>PON {
                        tilesToStringWall([...group, callTriggerTile])
                      }</button>)}</li>;

              case actionTypes.OPTION_KAN_OPEN_CALL:
                return <li key={i}>{
                  option.data.candidateTiles.map((group, j) =>
                    <button key={j} onClick={this.handleAction.bind(
                      this, optionToActionType(option.type), {
                        acceptedCandidate: group,
                        triggerTile: callTriggerTile
                      })}>KAN {
                        tilesToStringWall([...group, callTriggerTile])
                      }</button>)}</li>;

              case actionTypes.OPTION_RON_DISCARD:
                return <li key={i}>
                  <button onClick={this.handleAction.bind(
                    this, optionToActionType(option.type), option.data
                  )}>RON</button></li>;

              case actionTypes.OPTION_RON_KAN_OPEN_DRAW: return null;
              case actionTypes.OPTION_RON_KAN_CLOSED: return null;
              default: return null;
            }
          }).filter(option => option)}
        </ul></div>

        let playersList = <div style={{ display: 'flex' }}>
          {this.props.playersData.map((player, i) => (
            <div key={i} style={{ flex: 1 }}>
              <h5>{player.name}'s data:</h5>
              <p>Score: {player.score}</p>
              <p>Seatwind: {player.seatWind}</p>
              {tilesToImageLarge(player.hand)}
              {player.drawnTile !== null ?
                tilesToImageLarge([player.drawnTile]) : null}
              {tilesToImageSmall(player.discardPile)}
              <div>
                <p>Tile groups: </p>
                <ul style={{ listStyleType: 'none' }}>{
                  player.tileGroups.map((group, j) =>
                    <li key={j}>{tilesToImageSmall(group.tiles)}</li>)
                }</ul>
              </div>
              {this.props.seatWind === i ? nonDiscardOptionList : null}
              {this.props.seatWind === i ? discardOptionList : null}
            </div>
          ))}
        </div>

        return (
          <div style={{ margin: '50px' }}>
            <div>
              <h1>Playing as {this.props.loggedUser}.</h1>
              <div style={{ display: 'flex' }}>
                <div>
                  <h5>liveWall:</h5>
                  {tilesToImageSmall(this.props.liveWall)}
                </div>
                <div>
                  <h5>deadWall:</h5>
                  {tilesToImageSmall(this.props.deadWall)}
                </div>
              </div>
            </div>
            <hr />
            {playersList}
          </div>
        )
      }
      case gameStatus.END_ROUND_TURN: {
        let newPlayerScores = this.props.playersData.map(
          player => player.score);
        let prevPlayerScores = newPlayerScores.map((newScore, seatWind) =>
          newScore - this.props.roundTurnScoresBuffer[seatWind]);

        let scoreList = this.props.roundTurnScoresBuffer.map((scoreChange, i) =>
          <div key={i}>
            <h5>{this.props.playersData[i].name}'s score:</h5>
            <p>Previous score: {prevPlayerScores[i]}</p>
            <p>{`${scoreChange > 0 ? '+' : ''}${scoreChange}`}</p>
            <p>New score: {newPlayerScores[i]}</p>
          </div>
        );
        return (
          <div style={{ margin: '50px' }}>
            <h1>Welcome to the game page, {this.props.loggedUser}.</h1>
            <div style={{ display: 'flex' }}>
              {scoreList}
            </div>
          </div>
        )
      }
      case gameStatus.END_GAME: {

      }
    }

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

function tilesToImageLarge(tiles) {
  return <div>
    {tiles.map(tile => <img src={`large/${tileTypeOf(tile)}.png`} />)}
  </div>;
}

function tilesToImageSmall(tiles) {
  return <div>
    {tiles.map(tile => <img src={`small/${tileTypeOf(tile)}.png`} />)}
  </div>;
}

// Tile type computation
function tileTypeOf(tile) {
  if (Object.values(redDoraTileValues).includes(tile)) {
    return tile === redDoraTileValues.RED_MAN_5_1 ?
      tileTypes.RED_MAN_5 : tile === redDoraTileValues.RED_SOU_5_1 ?
        tileTypes.RED_SOU_5 : tileTypes.RED_PIN_5;
  }
  return Math.floor(tile / 4);
}

// Convert option type to corresponding action type
function optionToActionType(type) { return type + 20; }

export default Game;