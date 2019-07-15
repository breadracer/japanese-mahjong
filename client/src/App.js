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
      password: ''
    };
  }

  componentDidMount() {
    // Try connect with current cookie sent in request param
    // If auth success, connect to ws server
    // If no cookie, go to Login page

    const socket = new WebSocket(
      `ws://breadracer.com:8000/?access_token=${this.state.token}`);
    
    this.setState({ socket });
    socket.onopen = _ => {
      console.log('Connected to breadracer.com');
      this.setState({ connected: true });
    };
    socket.onclose = _ => {
      console.log('Cannot connect or disconnected to breadracer.com');
      this.setState({ connected: false });
    };
    socket.onmessage = event => {
      console.log(`Roundtrip time: ${Date.now() - event.data} ms`);
    };
  }

  handleTestSpeed = (e) => {
    if (this.state.connected) {
      this.state.socket.send(Date.now());
    } else {
      console.log('Not connected yet');
    }
  }

  handleSubmitLogin = (e) => {
      e.preventDefault();

      axios.post('http://breadracer.com:8000/api/login', {
        headers: { 
          crossDomain: true,
          withCredentials: true,
          Content_Type: 'application/json'
        },
        username: this.state.username,
        password: this.state.password
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

  onChange = e => { this.setState({[e.target.name]: e.target.value}); }

  render() {
    const title = this.state.connected ? (
      <h1>You are logged in!</h1>) : (
      <h1>Please log in first!</h1>
    );

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
        <button onClick={this.handleTestSpeed}>
          Get ws roundtrip time
        </button>

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
          <input type='text' title='password' onChange={this.onChange}
            name='password' value={this.state.password} />
          <button onClick={this.handleSubmitLogin}>
            Log me in
          </button>
        </form>


      </div>
    )
  }
}

export default App;
