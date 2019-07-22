import React from 'react';
import axios from 'axios';

import { HOST_NAME } from './constants'


export default class Gameboard extends React.Component {
  // props: socket, logged username, function to set socket's onmessage func

  constructor(props) {
    super(props);
    this.state = {
      chatRoom: [],
      chatInput: ''
    };
  }

  handleLogout = _ => {
    axios.post(`http://${HOST_NAME}:8000/api/logout`, {
      username: this.props.loggedUser,
    }, {
        headers: {
          'Cross-Domain': true,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => {
        console.log(res.data);
        this.props.socket.close();
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 ' +
          '00:00:01 GMT; path=/'
        document.cookie = 'session_user=; expires=Thu, 01 Jan ' +
          '1970 00:00:01 GMT; path=/';
        this.setState({
          chatRoom: [],
          chatInput: ''
        });
      }).catch(err => {
        console.log(err);
      });
  }

  handleSendMessage = e => {
    e.preventDefault();
    this.props.socket.send(this.state.chatInput);
    this.setState({ chatInput: '' });
  }
  
  // handleTestSpeed = _ => {
  //     this.props.socket.send(Date.now());
  // };

  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  componentDidMount() {
    this.props.webSocketSetOnMessage(event => {
      this.setState((prevState, _) => ({
        chatRoom: [...prevState.chatRoom, event.data]
      }));
    });
  }

  render() {
    const messageList = this.state.chatRoom.map(
      (e, i) => <p key={i}>{e}</p>);
    return (
      <div>
        <div>
          <button onClick={this.handleLogout}>Log out</button>
          {/* <button onClick={this.handleTestSpeed}>Get ws time</button> */}
        </div>
        <div>
          {messageList}
        </div>
        <form>
          <input type='text' title='chatInput' onChange={this.onChange}
            name='chatInput' value={this.state.chatInput} />
          <button onClick={this.handleSendMessage}>Send</button>
        </form>
      </div>
    )
  }
}