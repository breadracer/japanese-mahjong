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
      // loggedUser: null
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
      const socket = new WebSocket(
        `ws://breadracer.com:8000/?access_token=${
        cookie.parse(document.cookie).access_token}`);
  
      this.setState({ socket });
      socket.onopen = _ => {
        console.log('Connected to breadracer.com');
        this.setState({ connected: true });
      };
      socket.onclose = _ => {
        console.log('Cannot connect or disconnected to breadracer.com');
        this.setState({ connected: false, socket: null });
      };
      socket.onmessage = event => {
        console.log(`Roundtrip time: ${Date.now() - event.data} ms`);
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

    axios.post('http://breadracer.com:8000/api/register', {
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
    })
  }

  handleLogin = e => {
    e.preventDefault();

    axios.post('http://breadracer.com:8000/api/login', {
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
        this.setState({ loggedUser: res.data.user });
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
    // axios.post('http://breadracer.com:8000/api/logout', {
    //   username: this.state.loggedUser,
    // }, {
    //     headers: {
    //       'Cross-Domain': true,
    //       'Content-Type': 'application/json'
    //     },
    //     withCredentials: true
    //   }).then(res => {
    //     console.log(res.data);
    //     this.state.socket.close();
    //     document.cookie = '';
    //     this.setState({ loggedUser: null, socket: null });
    //   }).catch(err => {
    //     console.log(err);
    //   });
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  render() {
    const title = this.state.connected ? (
      <h1>You are connected!</h1>) : (
        <h1>Please try connect first!</h1>
      );

    // const userWelcome = this.state.loggedUser ? (
    //   <h1>Hi, {this.state.loggedUser}!</h1>
    // ) : (
    //   <h1>You are not logged in</h1>
    // )

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
        <button onClick={this.handleTestSpeed}>Get ws roundtrip time</button>
        <button onClick={this.webSocketTryConnect}>Try reconnecting</button>

        {/* <form action='http://breadracer.com/register' method='POST'>
          <input type='text' title='username' name='username' />
          <input type='text' title='password' name='password' />
          <button onClick={this.handleSubmit.bind(this, 'register')}>
            Sign me up
          </button>
        </form> */}

        <form>
          <input type='text' title='username' onChange={this.onChange}
            name='username' value={this.state.username} />
          <input type='password' title='password' onChange={this.onChange}
            name='password' value={this.state.password} />
          <button onClick={this.handleLogin}>Sign in</button>
          <button onClick={this.handleRegister}>Sign up</button>
        </form>

        <button onClick={this.handleLogout}>Sign out</button>



      </div>
    )
  }
}

export default App;
