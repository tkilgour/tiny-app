const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const urlDatabase = {
  'cuPSUz': {
    '9sm5xK': 'http://www.google.com',
    '52xa12': 'http://www.lighthouselabs.ca',
  }
};
const users = {
  'cuPSUz': {
    'id': 'cuPSUz',
    'email': 't.kilgour@gmail.com',
    'password': '$2a$10$3OJZumyWTp0p8DBABJP5tO9KXU7kHEKjU2RqH6zUxG5ifXhSOihfy'
  }
};

function generateRandomString() {
  let randomString = "";
  const dataSet = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  for (i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * 61);
    randomString += dataSet[randomNum]
  };
  return randomString;
}

function getCurrentUser(req) {
  for (user in users) {
    if (req.session['user_id'] === user) {
      return user;
    }
  }
  return "";
}

app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieSession({
  name: 'session',
  keys: ['BrmrMunuQnTFo5L7'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.send('Hello!');
});


app.get('/urls', (req, res) => {
  const currentUser = getCurrentUser(req);

  let templateVars = {
    user_id: req.session['user_id'],
    urls: urlDatabase[currentUser],
    user_email: ''
  };
  if (currentUser != '') {
    templateVars.user_email = users[templateVars.user_id].email;
  };
  res.render('urls_index', templateVars);
});


app.post('/urls/create', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser === '') {
    res.sendStatus(403);
  };

  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[currentUser][shortURL] = longURL;
  res.redirect(`/urls`);
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  const currentUser = getCurrentUser(req);

  let templateVars = {
    user_id: req.session['user_id'],
    urls: urlDatabase[currentUser],
    user_email: ''
  };
  if (getCurrentUser(req) != '') {
    templateVars.user_email = users[templateVars.user_id].email;
  };
  res.render('urls_new', templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <em>World</em></body></html>\n")
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = "";

  for (user in urlDatabase) {
    if (urlDatabase[user][shortURL]) {
      longURL = urlDatabase[user][shortURL];
    }
  }

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.sendStatus(404);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const currentUser = getCurrentUser(req);

  let shortURL = req.params.shortURL;
  delete urlDatabase[currentUser][shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
  const currentUser = getCurrentUser(req);

  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[currentUser][shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let loginPassed = false;
  let currentUser = "";

  for (let user in users) {
    if (users[user].email === email) {

      loginPassed = bcrypt.compareSync(password, users[user].password);
      if (loginPassed) {
        currentUser = user;
      }
    }
  }

  if (loginPassed) {
    req.session.user_id = currentUser;
    res.redirect('/')
  } else {
    res.sendStatus(403);
  }
});

app.get('/login', (req, res) => {
  res.render('urls_login')
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  function checkIfEmailExists (data) {
    for (let user in data) {
      return data[user]['email'] === email;
    };
  }

  if (!email || !password) {
    res.sendStatus(400);
  } else if (checkIfEmailExists(users)) {
    res.sendStatus(400);
  } else {
    users[userID] = {};
    users[userID].id = userID;
    users[userID].email = email;
    users[userID].password = hashed_password;

    urlDatabase[userID] = {};

    req.session.user_id = userID;
    res.redirect('/');
  }
});

app.get('/urls/:shortURL', (req, res) => {

  const currentUser = getCurrentUser(req);

  let templateVars = {
    user_id: req.session['user_id'],
    urls: urlDatabase[currentUser],
    user_email: '',
    shortURL: req.params.shortURL,
  };
  if (getCurrentUser(req) != '') {
    templateVars.user_email = users[templateVars.user_id].email;
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});