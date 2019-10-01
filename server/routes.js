const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const url = require('url');

const { constants } = require('./constants');
const users = require('./users');
const gameWorld = require('./gameWorld');

const headers = [
  ['Access-Control-Allow-Origin', `http://${constants.HOST_NAME}`],
  ['Access-Control-Allow-Methods', 'OPTIONS, POST, GET'],
  ['Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, ' +
    'Accept, Set-Cookie, Cross-Domain'],
  ['Access-Control-Max-Age', 86400], // 24 hours
  ['Access-Control-Allow-Credentials', true],
  ['Content-Type', 'application/json']
];

module.exports.requestListener = function (req, res) {
  let query = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    // For CORS
    res.writeHead(200, headers);
    res.end();
  } else if (req.method == 'POST') {
    // Handle data stream
    let requestData = '';
    req.on('data', chunk => { requestData += chunk.toString(); });
    req.on('end', async () => {
      let requestBody = JSON.parse(requestData);
      console.log('POST request', requestBody, 'to', query.pathname);
      switch (query.pathname) {
        case '/api/register': {
          // Check if the user already exists
          // TODO: Store users in the database rather than in RAM
          if (await users.hasUser(requestBody.username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({ message: 'User already registered' }));
          } else {
            // Store the hashed password
            let hash = await bcrypt.hash(requestBody.password, 10);
            await users.createUser(requestBody.username, hash);
            console.log(`Registered ${requestBody.username}`);
            res.writeHead(201, 'Created', headers);
            res.end(JSON.stringify({ message: 'Successfully signed up' }));
          }
          break;
        }
        case '/api/login': {
          let { username, password } = requestBody;

          // Check if already logged in
          if (gameWorld.hasSession(username)) {
            res.writeHead(400, 'Bad Request', headers);
            res.end(JSON.stringify({
              message: 'Already logged in somewhere else'
            }));
          }

          // Verify user information
          if (await users.hasUser(username) && await bcrypt.compare(
            password, await users.getUserToken(username))) {

            // Generate jwt token
            let token = jwt.sign(
              { username }, constants.SECRET_KEY, { expiresIn: '24h' });

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
          if (!gameWorld.hasSession(requestBody.username)) {
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
