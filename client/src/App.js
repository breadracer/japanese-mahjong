import React from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      connected: false
    };
  }

  componentDidMount() {
    const socket = new WebSocket('ws://localhost:8000');
    this.setState({ socket });
    socket.onopen = _ => {
      console.log('Connected to breadracer.com');
      this.setState({ connected: true });
    };
    socket.onclose = _ => {
      console.log('Disconnected to breadracer.com');
    };
    socket.onmessage = event => {
      console.log(`Roundtrip time: ${Date.now() - event.data} ms`);
    };
  }

  handleSubmit = () => {
    if (this.state.connected)
      this.state.socket.send(Date.now());
    else
      console.log('Not connected yet');
  }

  render() {
    return (
      <div>
        <h1>Welcome to the homepage!</h1>
        <button onClick={this.handleSubmit}>Sumbit message!</button>
      </div>
    )
  }
}

export default App;
