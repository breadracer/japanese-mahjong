import React from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';

import { HOST_NAME } from './constants'


export default class Register extends React.Component {
  // props: is user connected

  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      errorMessage: null,
      redirectToLogin: false,
    };
  }

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

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
        this.setState({ redirectToLogin: true });
      }).catch(err => {
        console.log(err);
        this.setState({
          username: '',
          password: '',
          errorMessage: 'Register failed'
        });
      });
  }

  render() {
    //Redirect if user already logged in (connected)
    const redirect = this.props.connected ?
      <Redirect to='/' /> :
      this.state.redirectToLogin ?
        <Redirect push to='/login' /> : null;

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
          <button onClick={this.handleRegister}>Submit!</button>
        </form>
        {errorMessage}
      </div>
    );
  }
}