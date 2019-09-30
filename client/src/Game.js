import React from 'react';
import {
  actionTypes, messageTypes, optionStatus,
  gameStatus, tileTypes, redDoraTileValues
} from './constants';

// NOTE: This is designed for 4-player only
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

        let getPlayerProfile = player => <div style={{ height: '235px' }}>
          <h5 style={{ textAlign: 'center' }}>{player.name}</h5>
          <div style={{
            display: 'flex', justifyContent: 'space-around'
          }}><div>
              {tilesBackSmall(player.drawnTile !== null ?
                [...player.hand, player.drawnTile] : player.hand)}
            </div>
            <div style={{
              display: 'flex', flex: 1, justifyContent: 'center'
            }}>
              {player.tileGroups.map((group, j) =>
                <div key={j}>{tilesToImageSmall(group.tiles)}</div>)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexFlow: 'column',
            alignItems: 'center'
          }}>
            <p style={{ textAlign: 'center' }}>Discard pile:</p>
            {tilesToImageSmall(player.discardPile)}
          </div>
        </div>;

        let getSelfProfile = player => <div>
          <div style={{
            display: 'flex', justifyContent: 'space-around'
          }}>
            <div>
              {tilesToImageLarge(player.drawnTile !== null ?
                [...player.hand, player.drawnTile] : player.hand)}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center'
            }}>
              {player.tileGroups.map((group, j) =>
                <div key={j}>{tilesToImageLarge(group.tiles)}</div>)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexFlow: 'column'
          }}>
            <p>Discard pile:</p>
            {tilesToImageSmall(player.discardPile)}
            <div>
              {nonDiscardOptionList}
              {discardOptionList}
            </div>
          </div>
        </div>;

        let highLightStyle = seatWind => ({
          fontWeight: this.props.turnCounter ===
            seatWind ? 'bold' : 'normal'
        });

        let playersList = <div style={{ display: 'flex', flexFlow: 'column' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <h1>Playing as {this.props.loggedUser}</h1>
              <h4>Dora indicators:</h4>
              {this.props.deadWall.slice(4 + this.props.kanCounter,
                9 + this.props.kanCounter).map((tile, i) =>
                  i <= this.props.kanCounter ?
                    <img key={i} src={`small/${tileTypeOf(tile)}.png`} /> :
                    <img key={i} src={`small/back.png`} />)}
            </div>
            <div style={{ flex: 1 }}>
              {getPlayerProfile(this.props.playersData[
                (this.props.seatWind + 2) % 4])}
            </div>
            <div style={{ flex: 1 }}></div>
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ flex: 1 }}>
              {getPlayerProfile(this.props.playersData[
                (this.props.seatWind + 3) % 4])}
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              flexFlow: 'column',
              borderStyle: 'solid',
              textAlign: 'center'
            }}>
              <div style={{ flex: 1, display: 'flex' }}>
                <div style={{ flex: 1 }}></div>
                <div style={{ flex: 1 }}>
                  <p style={highLightStyle((this.props.seatWind + 2) % 4)}
                  >Score: {this.props.playersData[
                    (this.props.seatWind + 2) % 4].score}</p>
                  <p style={highLightStyle((this.props.seatWind + 2) % 4)}>Seatwind: {(this.props.seatWind + 2) % 4}</p>
                </div>
                <div style={{ flex: 1 }}></div>
              </div>
              <div style={{ flex: 1, display: 'flex' }}>
                <div style={{ flex: 1 }}>
                  <p style={highLightStyle((this.props.seatWind + 3) % 4)}
                  >Score: {this.props.playersData[
                    (this.props.seatWind + 3) % 4].score}</p>
                  <p style={highLightStyle((this.props.seatWind + 3) % 4)}>Seatwind: {(this.props.seatWind + 3) % 4}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <h5>Round wind: {`${this.props.roundWind}-${
                    this.props.roundWindCounter}`}</h5>
                  <h5>Left tiles: {this.props.liveWall.length}</h5>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={highLightStyle((this.props.seatWind + 1) % 4)}>Score: {this.props.playersData[
                    (this.props.seatWind + 1) % 4].score}</p>
                  <p style={highLightStyle((this.props.seatWind + 1) % 4)}>Seatwind: {(this.props.seatWind + 1) % 4}</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex' }}>
                <div style={{ flex: 1 }}></div>
                <div style={{ flex: 1 }}>
                  <p style={highLightStyle(this.props.seatWind)}
                  >Score: {this.props.playersData[this.props.seatWind].score}
                  </p>
                  <p style={highLightStyle(this.props.seatWind)}
                  >Seatwind: {this.props.seatWind}</p>
                </div>
                <div style={{ flex: 1 }}></div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {getPlayerProfile(this.props.playersData[
                (this.props.seatWind + 1) % 4])}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {getSelfProfile(this.props.playersData[this.props.seatWind])}
          </div>
        </div>

        return (
          <div style={{ margin: '10px' }}>
            {/* <div>
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
            <hr /> */}
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
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
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

function tilesBackSmall(tiles) {
  return <div>
    {tiles.map((tile, i) => <img key={i} src={'small/back.png'} />)}
  </div>
}

function tilesToImageLarge(tiles) {
  return <div>
    {tiles.map((tile, i) =>
      <img key={i} src={`large/${tileTypeOf(tile)}.png`} />)}
  </div>;
}

function tilesToImageSmall(tiles) {
  return <div>
    {tiles.map((tile, i) =>
      <img key={i} src={`small/${tileTypeOf(tile)}.png`} />)}
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