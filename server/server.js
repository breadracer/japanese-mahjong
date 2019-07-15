#!/usr/bin/node

const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': 2592000, // 30 days
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'text/plain'
};

let users = [
  {
    username: 'root',
    password: '123'
  }
]

let connections = []

let handleRegister = (req, res) => {
  console.log('request to /api/register');
}

let handleLogin = (req, res) => {
  console.log(req.method)
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS success');
    res.writeHead(200, 'OK', headers);
    res.end();
  } else if (req.method === 'POST') {
    let requestData = '';
    req.on('data', chunk => { requestData += chunk.toString(); });
    req.on('end', () => {
      console.log(requestData);

      // TODO: Verify user information
      if (true) {
        res.writeHead(200, 'OK', {
          'Set-Cookie': 'access_token=abc',
          ...headers
        });
        res.write(JSON.stringify({as: 'as'}));
        res.end();
      }
    })
  }
  console.log('request to /api/login');
}


let requestListener = (req, res) => {
  let query = url.parse(req.url, true);


  switch(query.pathname) {
    case '/api/register': handleRegister(req, res); break;
    case '/api/login': handleLogin(req, res); break;
    default: console.log('invalid request path');
  }
}

const server = http.createServer(requestListener);

let verifyClient = (info, callback) => {
  let token = url.parse(info.req.url, true).query.access_token;
  
  // TODO: Verify the token
  if (token && token === 'abc') {
    callback(true);
  } else {
    callback(false, 401, 'Unauthorized');
  }
}

const webSocketServer = new WebSocket.Server({ server, verifyClient });
webSocketServer.on('connection', socket => {

  socket.on('message', msg => {
    console.log('received: %s', msg);
    socket.send(msg);
  });

});

server.listen(8000);

