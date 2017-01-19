const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};
const users = {};

function generateRandomString() {
  let randomString = "";
  const dataSet = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  for (i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * 61);
    randomString += dataSet[randomNum]
  };
  return randomString;
}

app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render('urls_index', templateVars);
});

app.post('/urls/create', (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <em>World</em></body></html>\n")
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});

app.get('/register', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

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
    users[userID].password = password;
    res.cookie('user_id', userID);
    // res.send(users);
    res.redirect('/');
  }
});

app.get('/:id', (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});