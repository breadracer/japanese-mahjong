import React from 'react';
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom';
import axios from 'axios';
import cookie from 'cookie';
import './App.css';

// import Login from './Login'
// import Register from './Register'
// import Home from './Home'

// TODO: Set these to some environment variable
const HOST_NAME = 'breadracer.com';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      socket: null,
      connected: false,
      loggedUser: cookie.parse(document.cookie).session_user || null,
      token: cookie.parse(document.cookie).access_token || '',
      chatRoom: [],
      chatInput: ''
    };
  }

  componentDidMount() {

    // Try connect with current cookie sent in request param
    // If auth success, connect to ws server
    // If no cookie, go to Login page
    this.webSocketTryConnect(null);

  }

  webSocketTryConnect = _ => {
    if (!this.state.socket) {
      let socket;
      try {
        socket = new WebSocket(
          `ws://${HOST_NAME}:8000/?access_token=${
          cookie.parse(document.cookie).access_token
          }&session_user=${cookie.parse(document.cookie).session_user}`);
      } catch (err) {
        console.log(err);
        return;
      }

      socket.onopen = _ => {
        console.log(`Connected to ${HOST_NAME}`);
        this.setState({ connected: true, socket });
      };
      socket.onclose = _ => {
        console.log(`Cannot connect or disconnected to ${HOST_NAME}`);
        this.setState({ connected: false, socket: null, loggedUser: null });
      };
      socket.onmessage = event => {
        this.setState((prevState, _) => ({
          chatRoom: [...prevState.chatRoom, event.data]
        }));
      };
    } else {
      console.log('Already connected');
    }
  }

  handleTestSpeed = _ => {
    if (this.state.connected) {
      this.state.socket.send(Date.now());
    } else {
      console.log('Not connected yet');
    }
  }

  handleRegister = e => {
    e.preventDefault();

    axios.post(`http://${HOST_NAME}:8000/api/register`, {
      username: this.state.username,
      password: this.state.password
    }, {
        headers: {
          'Cross-Domain': true,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => {
        console.log(res.data);
      }).catch(err => {
        console.log(err);
      });

    this.setState({
      username: '',
      password: ''
    });
  }

  handleLogin = e => {
    e.preventDefault();

    axios.post(`http://${HOST_NAME}:8000/api/login`, {
      username: this.state.username,
      password: this.state.password
    }, {
        headers: {
          'Cross-Domain': true,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => {
        console.log(res.data);
        this.setState({ loggedUser: res.data.username });
        this.webSocketTryConnect(null);
      }).catch(err => {
        console.log(err);
      });

    this.setState({
      username: '',
      password: ''
    })
  }

  handleLogout = _ => {
    axios.post(`http://${HOST_NAME}:8000/api/logout`, {
      username: this.state.loggedUser,
    }, {
        headers: {
          'Cross-Domain': true,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => {
        console.log(res.data);
        this.state.socket.close();
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 ' +
          '00:00:01 GMT; path=/'
        document.cookie = 'session_user=; expires=Thu, 01 Jan ' +
          '1970 00:00:01 GMT; path=/';
        this.setState({
          loggedUser: null,
          socket: null,
          token: '',
          chatRoom: [],
          chatInput: ''
         });
      }).catch(err => {
        console.log(err);
      });
  }

  handleSendMessage = e => {
    e.preventDefault();
    if (this.state.connected) {
      this.state.socket.send(this.state.chatInput);
      this.setState({ chatInput: '' });
    } else {
      console.log('Not connected yet');
    }
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  render() {
    const title = this.state.connected ?
      <h1>You are connected!</h1> :
      <h1>Please try connect first!</h1>;

    const userWelcome = this.state.loggedUser ?
      <h3>Hi, {this.state.loggedUser}!</h3> :
      <h3>You are not logged in</h3>;

    const messageList = this.state.chatRoom.map((e, i) => <p id={i}>{e}</p>);

    const mainPage = this.state.connected ?
      <div>
        <div>
          <button onClick={this.handleLogout}>Log out</button>
          <button onClick={this.handleTestSpeed}>Get ws time</button>
        </div>
        <div>
          {messageList}
        </div>
        <form>
          <input type='text' title='chatInput' onChange={this.onChange}
            name='chatInput' value={this.state.chatInput} />
          <button onClick={this.handleSendMessage}>Send</button>
        </form>
      </div> :
      <form>
        <input type='text' title='username' onChange={this.onChange}
          name='username' value={this.state.username} />
        <input type='password' title='password' onChange={this.onChange}
          name='password' value={this.state.password} />
        <button onClick={this.handleLogin}>Sign in</button>
        <button onClick={this.handleRegister}>Sign up</button>
      </form>



    return (
      // <BrowserRouter>
      //   <Switch>
      //     <Route exact path='/' component={Home} />
      //     <Route exact path='/register' component={Register} />
      //     <Route exact path='/login' component={Login} />
      //   </Switch>
      // </BrowserRouter>

      <div>
        {title}
        {userWelcome}
        {mainPage}
        <button onClick={this.webSocketTryConnect}>Try reconnecting</button>
      </div>
    )
  }
}

export default App;
