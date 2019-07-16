#!/usr/bin/node

const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const headers = {
  'Access-Control-Allow-Origin': 'http://breadracer.com',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Allow-Headers':
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, ' +
    'Accept, Set-Cookie, Cross-Domain',
  'Access-Control-Max-Age': 86400, // 24 hours
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

// TODO: Set this to some environment variable
const SECRET_KEY = 'SECRET_KEY';

let users = [];

// TODO: Create a map between these two
let sessions = [];
let connections = [];

// let handleRegister = ([req, res]) => {
//   console.log('request to /api/register');

//   if ()

// }

// let handleLogin = ([req, res]) => {
//   // TODO: Verify user information
//   if (true) {
//     res.writeHead(200, 'OK', {
//       'Set-Cookie': 'access_token=abc; Path=/',
//       ...headers
//     });
//     res.write(JSON.stringify({ as: 'as' }));
//     res.end();
//   }
//   console.log('request to /api/login');
// }


function requestListener(req, res) {
  let query = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS success');
    res.writeHead(200, headers);
    res.end();
  } else if (req.method == 'POST') {
    // Handle data stream
    let requestData = '';
    req.on('data', chunk => { requestData += chunk.toString(); });
    req.on('end', () => {
      let requestBody = JSON.parse(requestData);
      console.log(requestBody);
      switch (query.pathname) {
        case '/api/register': {
          // Check if the user already exists
          // TODO: Store users in the database rather than in RAM
          if (users.some(e => e.username === requestBody.username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({ message: 'User already registered' }));
          } else {
            let hash = bcrypt.hashSync(requestBody.password, 10);
            users.push({ username: requestBody.username, hash });
            console.log(users);
            res.writeHead(201, 'Created', headers);
            res.end(JSON.stringify({ message: 'Successfully signed up' }));
          }
          break;
        }
        case '/api/login': {
          let user = users.find(e => e.username === requestBody.username);
          if (user && bcrypt.compareSync(requestBody.password, user.hash)) {
            // Generate JWT token
            let token = jwt.sign({
              username: user.username
            }, SECRET_KEY, {
                expiresIn: '24h'
              });
            console.log(token);
            res.writeHead(200, 'OK', {
              'Set-Cookie': `access_token=${token}; Path=/`,
              ...headers
            });
            res.end(JSON.stringify({
              message: 'Successfully signed in',
              user: user.username
            }));
            // sessions.push(user.username);
            // console.log(sessions);
          } else {
            res.writeHead(401, 'Unauthorized', headers);
            res.end(JSON.stringify({
              message: 'Incorrect username or password'
            }));
          }
          break;
        }
        // case '/api/logout': {
        //   let index = sessions.indexOf(requestBody.username);
        //   if (index > -1)
        //     sessions.splice(index, 1);
        //   res.writeHead(200, 'OK', headers);
        //   res.end(JSON.stringify({
        //     message: `Bye ${requestBody.username}!`,
        //   }));
        //   break;
        // }
        default: console.log('invalid request path');
      }
    });
  }


}

const server = http.createServer(requestListener);

let verifyClient = (info, callback) => {
  let token = url.parse(info.req.url, true).query.access_token || '';
  let decoded = {};
  try {
    decoded = jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.log(err);
    callback(false, 401, 'Unauthorized');
  }
  callback(true);
}

const webSocketServer = new WebSocket.Server({ server, verifyClient });
webSocketServer.on('connection', socket => {
  // socket.on('open', () => {
  //   console.log(`A new connection is established`);
  //   connections.push(socket);
  //   console.log(connections);
  //   socket.send(`Hello, client #${connections.length}`);
  // })
  // socket.on('close', () => {
  //   console.log(`A connection is closed`);
  //   let index = connections.indexOf(socket);
  //   if (index > -1)
  //     connections.splice(index, 1);
  //   console.log(connections);
  // })
  socket.on('message', msg => {
    console.log('received: %s', msg);
    socket.send(msg);
  });

});

server.listen(8000);

