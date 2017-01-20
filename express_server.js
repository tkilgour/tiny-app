const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

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
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser === '') {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


app.get('/urls', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser === '') {
    res.status(401).send('Whoops! Please <a href="/login">login</a>.')
  } else {
    let templateVars = {
      user_id: req.session['user_id'],
      urls: urlDatabase[currentUser],
      user_email: users[req.session['user_id']].email
    };
    res.render('urls_index', templateVars);
  }
});


app.post('/urls', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser === '') {
    res.status(401).send('Whoops! Please <a href="/login">login</a>.');
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

  if (currentUser === '') {
    res.status(401).send('Whoops! Please <a href="/login">login</a>.')
  } else {
    let templateVars = {
      user_id: req.session['user_id'],
      urls: urlDatabase[currentUser],
      user_email: users[req.session['user_id']].email
    };
    res.render('urls_new', templateVars);
  }
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
    res.status(404).send('Sorry, URL does not exist.');
  }
});

app.delete('/urls/:shortURL', (req, res) => {
  const currentUser = getCurrentUser(req);

  let shortURL = req.params.shortURL;
  delete urlDatabase[currentUser][shortURL];
  res.redirect('/urls');
});

app.put('/urls/:shortURL', (req, res) => {
  const currentUser = getCurrentUser(req);
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  // check if no user is logged in
  if (currentUser === '') {
    res.status(401).send('Whoops! Please <a href="/login">login</a>.')
    return;
  }

  // check if logged in user does not match the user that owns this url
  for (user in urlDatabase) {
    if (urlDatabase[user][shortURL] && currentUser != user) {
      res.status(403).send('Sorry, URL does not belong to you.<br><a href="/">Return</a>');
      return;
    }
  }

  // if url exists - update url and redirect'
  for (user in urlDatabase) {
    if (urlDatabase[user][shortURL]) {
      urlDatabase[currentUser][shortURL] = longURL;
      res.redirect('/urls');
      return;
    }
  }

  // otherwise, url does not exist
  res.status(404).send('Sorry, URL does not exist.<br><a href="/">Return</a>')
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
    res.redirect('/');
  } else {
    res.status(401).send('Sorry, that email and password combination is incorrect.<br><a href="/login">Return</a>');
  }
});

app.get('/login', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser) {
    res.redirect('/');
    return;
  }
  res.render('urls_login');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/register', (req, res) => {
  const currentUser = getCurrentUser(req);

  if (currentUser) {
    res.redirect('/');
    return;
  }
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
    res.status(400).send('Please enter your email and password.<br><a href="/register">Return</a>');
  } else if (checkIfEmailExists(users)) {
    res.status(400).send('Sorry, that email already exists in our system.<br><a href="/register">Return</a>');
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
  const shortURL = req.params.shortURL;

  // check if no user is logged in
  if (currentUser === '') {
    res.status(401).send('Whoops! Please <a href="/login">login</a>.')
    return;
  }

  // check if logged in user does not match the user that owns this url
  for (user in urlDatabase) {
    if (urlDatabase[user][shortURL] && currentUser != user) {
      res.status(403).send('Sorry, URL does not belong to you.<br><a href="/">Return</a>');
      return;
    }
  }

  // if url exists - render 'urls_show'
  for (user in urlDatabase) {
    if (urlDatabase[user][shortURL]) {
      let templateVars = {
        shortURL: shortURL,
        user_id: req.session['user_id'],
        urls: urlDatabase[currentUser],
        user_email: users[req.session['user_id']].email
      };
      res.render('urls_show', templateVars);
      return;
    }
  }

  // otherwise, url does not exist
  res.status(404).send('Sorry, URL does not exist.<br><a href="/">Return</a>')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});