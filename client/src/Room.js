import React from 'react';

class Room extends React.Component {
  onChange = e => { this.setState({ [e.target.name]: e.target.value }); }

  render() {
    return <h1>Welcome to the room page!</h1>
  }
}

export default Room;