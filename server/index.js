const express = require('express');
const { Pool, Client } = require('pg');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const knex = require('knex');
const app = express();

const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    key: 'userId',
    secret: 'subscribe',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const db = knex({
  client: 'pg',
  connection: {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'auth',
    password: 'sophia100',
  },
});

app.post('/register', (req, res) => {
  console.log(req.body);
  const username = req.body.username;
  const password = req.body.password;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
    }
    db.insert({ username, hash })
      .into('users')
      .catch((err) => console.log(err));
  });
});

const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    res.send('Yo, we need a token, please give it to us next time!');
  } else {
    jwt.verify(token, 'jwtsecret', (err, decoded) => {
      if (err) {
        console.log(err);
        res.json({ auth: false, message: 'You failed to authenticate' });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};

app.get('/isUserAuth', verifyJWT, (req, res) => {
  res.send('Yo, you are authenticated congrats.');
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  db.select('*')
    .from('users')
    .where('username', username)
    .then((result) => {
      if (result.length > 0) {
        bcrypt.compare(password, result[0].hash, (err, response) => {
          if (response) {
            const id = result[0].id;
            const token = jwt.sign({ id }, 'jwtsecret', {
              expiresIn: 300,
            });
            req.session.user = result;
            res.json({ auth: true, token: token, result: result });
          } else {
            res.json({
              auth: false,
              message: 'wrong username/password combination',
            });
          }
        });
      } else {
        res.json({ auth: false, message: 'No user exists' });
      }
    })
    .catch((err) => {
      res.send({ err: err });
    });
});

app.listen(3001, () => {
  console.log('App listening on port 3000');
});
