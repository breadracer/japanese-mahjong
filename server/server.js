const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8000 });
server.on('connection', ws => {
  ws.on('message', msg => {
    console.log('received: %s', msg);
    ws.send(msg);
  });
});

