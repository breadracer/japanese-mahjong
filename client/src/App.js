import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import cookie from 'cookie';
import './App.css';

import { HOST_NAME } from './constants';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import Gameboard from './Gameboard';


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Connection related
      socket: null,
      connected: false,
      loggedUser: cookie.parse(document.cookie).session_user || null,
      token: cookie.parse(document.cookie).access_token || null,
    };
  }

  componentDidMount() {
    this.webSocketTryConnect(null);
  }

  // Upon success, update App's state: loggedUser, connected, socket, and
  // setup the socket's onopen, onclose function; Upon failure, do nothing
  webSocketTryConnect = _ => {
    let { access_token, session_user } = cookie.parse(document.cookie);

    if (this.state.socket) {
      console.log('Already connected');
    } else if (session_user && access_token) {
      let socket;
      try {
        socket = new WebSocket(
          `ws://${HOST_NAME}:8000/?access_token=${access_token}` +
          `&session_user=${session_user}`);
      } catch (err) {
        console.log(err);
        return false;
      }

      socket.onopen = _ => {
        console.log(`Connected to ${HOST_NAME}`);
        this.setState({ connected: true, socket, loggedUser: session_user });
      };

      socket.onclose = _ => {
        console.log(`Cannot connect or disconnected to ${HOST_NAME}`);
        this.setState({
          connected: false,
          socket: null,
          loggedUser: null,
          token: ''
        });
      };
    } else {
      console.log('No session is found');
      return false;
    }
    return true;
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path='/' render={
            props => !this.state.connected ?
              <Home {...props}
                connected={this.state.connected}
                loggedUser={this.state.loggedUser} /> :
              <Gameboard {...props}
                socket={this.state.socket}
                loggedUser={this.state.loggedUser} />
          } />
          <Route exact path='/register'
            render={
              props => <Register {...props}
                connected={this.state.connected} />
            } />
          <Route exact path='/login'
            render={
              props => <Login {...props}
                connected={this.state.connected}
                webSocketTryConnect={this.webSocketTryConnect} />
            } />
        </Switch>
      </BrowserRouter>
    );
  }
}