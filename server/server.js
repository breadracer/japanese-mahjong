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
const url = require('url');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const headers = [
  ['Access-Control-Allow-Origin', 'http://breadracer.com'],
  ['Access-Control-Allow-Methods', 'OPTIONS, POST'],
  ['Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, ' +
    'Accept, Set-Cookie, Cross-Domain'],
  ['Access-Control-Max-Age', 86400], // 24 hours
  ['Access-Control-Allow-Credentials', true],
  ['Content-Type', 'application/json']
];

// TODO: Set this to some environment variable
const SECRET_KEY = 'SECRET_KEY';

let users = {};

let sessions = {};

function requestListener(req, res) {
  let query = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    // For CORS
    res.writeHead(200, headers);
    res.end();
  } else if (req.method == 'POST') {
    // Handle data stream
    let requestData = '';
    req.on('data', chunk => { requestData += chunk.toString(); });
    req.on('end', () => {
      let requestBody = JSON.parse(requestData);
      console.log('POST request', requestBody);
      switch (query.pathname) {
        case '/api/register': {
          // Check if the user already exists
          // TODO: Store users in the database rather than in RAM
          if (users.hasOwnProperty(requestBody.username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({ message: 'User already registered' }));
          } else {
            // Store the hashed password
            let hash = bcrypt.hashSync(requestBody.password, 10);
            users[requestBody.username] = hash;
            console.log(`Registered ${requestBody.username}`);
            res.writeHead(201, 'Created', headers);
            res.end(JSON.stringify({ message: 'Successfully signed up' }));
          }
          break;
        }
        case '/api/login': {
          let { username, password } = requestBody;

          // Check if already logged in
          if (sessions.hasOwnProperty(username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({
              message: 'Already logged in somewhere else'
            }));
          }

          // Verify user information
          if (users.hasOwnProperty(username) &&
            bcrypt.compareSync(password, users[username])) {

            // Generate jwt token
            let token = jwt.sign(
              { username }, SECRET_KEY, { expiresIn: '24h' });

            // Send back token in Set-Cookie header
            res.writeHead(200, 'OK', [
              ['Set-Cookie', `access_token=${token}; Path=/`],
              ['Set-Cookie', `session_user=${username}; Path=/`],
              ...headers
            ]);
            res.end(JSON.stringify({
              username,
              message: `Successfully logged in: ${username}`
            }));
          } else {

            // 401 if verification failed
            res.writeHead(401, 'Unauthorized', headers);
            res.end(JSON.stringify({
              message: 'Incorrect username or password'
            }));
          }
          break;
        }
        case '/api/logout': {
          // Check if logged in
          if (!sessions.hasOwnProperty(requestBody.username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({
              message: 'Not logged in'
            }));
          }
          res.writeHead(200, 'OK', headers);
          res.end(JSON.stringify({
            message: `Bye, ${requestBody.username}!`,
          }));
          break;
        }
        default: console.log('Invalid request path');
      }
    });
  }
}

const server = http.createServer(requestListener);

function verifyClient(info, callback) {
  let { access_token, session_user } = url.parse(info.req.url, true).query;
  let flag = false;

  // Check if the same user already connected somewhere else
  if (sessions.hasOwnProperty(session_user)) {
    console.log(`User ${session_user} already logged in, ` +
      'closing connection...');
    callback(false, 400, 'Bad Request');

    // Check if such user exists
  } else if (!users.hasOwnProperty(session_user)) {
    console.log(`Invalid username: ${session_user}, closing connection...`);
    callback(false, 400, 'Bad Request');
  } else {
    // Verify client token in param query
    let decode = {};
    try {
      decode = jwt.verify(access_token, SECRET_KEY);
    } catch (err) {
      console.log('Invalid token');
      callback(false, 401, 'Unauthorized');
    }

    // Check if the correct username is decoded
    if (decode.username === session_user) {
      flag = true;
      callback(true);
    } else {
      console.log('Inconsistent request username');
      callback(false, 401, 'Unauthorized');
    }
  }

  if (flag) console.log(`Passed verifyClient: ${session_user}`);
}

const webSocketServer = new WebSocket.Server({ server, verifyClient });

webSocketServer.on('connection', (socket, req) => {
  let username = url.parse(req.url, true).query.session_user;

  // Add session record
  console.log(`A new connection is established`);
  sessions[username] = socket;

  socket.send(`Hello, ${username}`);
  console.log(Object.keys(sessions));

  socket.on('close', (_, reason) => {
    // Remove session record
    sessions[username] = null;
    delete sessions[username];
    console.log(`A connection is closed`);
    console.log(Object.keys(sessions));
  });

  socket.on('message', msg => {
    console.log('received: %s', msg);
    socket.send(msg);
  });
});

server.listen(8000);