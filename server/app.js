#!/usr/bin/node

// Connection/Session lifecycle:

// User not connected logs in (on success)
// -> server signs and sends jwt based on username via Set-Cookie header
// -> client sets cookie = jwt, set state to logged in, then tries to 
//    connect with that cookie

// User connects with cookie (on success)
// -> server records the <username: websocket> pair
// -> client set state to connected, save the socket and username

// TODO: Ping and Pong to check user connection
// Logged in user disconnected

// User connected logs out
// -> server close the socket resp w/ username, delete the session record
// -> client set state to disconnected and logged out (passively via 'on 
//    close'), remove the socket and username, set the stored cookie to
//    expired

const http = require('http');
const WebSocket = require('ws');

const { requestListener } = require('./http');
const {
  connectionHandler,
  heartbeat,
  verifyClient
} = require('./websocket');


const server = http.createServer(requestListener);
const webSocketServer = new WebSocket.Server({ server, verifyClient });
webSocketServer.on('connection', connectionHandler);
server.listen(8000);

// Track client connection using ping and pong
setInterval(heartbeat, 20000);