import React from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';

import { constants } from './constants'


export default class Login extends React.Component {
  // props: is user connected, try ws connect function

  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      errorMessage: null,
      redirectToGame: false
    };
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  handleLogin = e => {
    e.preventDefault();
    axios.post(`http://${constants.HOST_NAME}:8000/api/login`, {
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
        if (this.props.webSocketTryConnect(null)) {
          this.setState({ redirectToGame: true });
        } else {
          this.setState({
            username: '',
            password: '',
            errorMessage: 'WebSocket connection failed'
          });
        }
      }).catch(err => {
        console.log(err);
        this.setState({
          username: '',
          password: '',
          errorMessage: 'Login failed'
        });
      });
  }

  render() {
    const redirect = this.state.redirectToGame || this.props.connected ?
      <Redirect to='/' /> : null;
    const errorMessage = this.state.errorMessage ?
      <h5>{this.state.errorMessage}</h5> : null;
    return (
      <div>
        {redirect}
        <form>
          <input type='text' placeholder='username'
            onChange={this.onChange} name='username'
            value={this.state.username} />
          <input type='password' placeholder='password'
            onChange={this.onChange} name='password'
            value={this.state.password} />
          <button onClick={this.handleLogin}>Submit!</button>
        </form>
        {errorMessage}
      </div>
    );
  }
}