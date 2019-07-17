import React from 'react';
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom';
import axios from 'axios';
import cookie from 'cookie';
import './App.css';

// import Login from './Login'
// import Register from './Register'
// import Home from './Home'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      connected: false,
      token: cookie.parse(document.cookie).access_token || '',
      username: '',
      password: '',
      // TODO: More on this later
      loggedUser: cookie.parse(document.cookie).session_user || null
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
          `ws://localhost:8000/?access_token=${
          cookie.parse(document.cookie).access_token
          }&session_user=${cookie.parse(document.cookie).session_user}`);
      } catch (err) {
        console.log(err);
        return;
      }

      socket.onopen = _ => {
        console.log('Connected to localhost');
        this.setState({ connected: true, socket });
      };
      socket.onclose = _ => {
        console.log('Cannot connect or disconnected to localhost');
        this.setState({ connected: false, socket: null, loggedUser: null });
      };
      socket.onmessage = event => {
        console.log(event.data);
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

    axios.post('http://localhost:8000/api/register', {
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

    axios.post('http://localhost:8000/api/login', {
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
    axios.post('http://localhost:8000/api/logout', {
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
        this.setState({ loggedUser: null, socket: null, token: '' });
      }).catch(err => {
        console.log(err);
      });
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  render() {
    const title = this.state.connected ?
      <h1>You are connected!</h1> :
      <h1>Please try connect first!</h1>;

    const userWelcome = this.state.loggedUser ?
      <h3>Hi, {this.state.loggedUser}!</h3> :
      <h3>You are not logged in</h3>;

    const mainPage = this.state.connected ?
      <div>
        <button onClick={this.handleLogout}>Sign out</button>
        <button onClick={this.handleTestSpeed}>Get ws time</button>
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
