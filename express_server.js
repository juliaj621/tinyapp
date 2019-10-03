const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const { getUserByEmail, generateRandomString } = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ["donut"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs"); // tells the Express app to use EJS as its templating engine

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = { };

const users = { };

// Takes user to the login page if not logged in or the home page if logged in when they access the general website
app.get("/", (req, res) => {
  let templateVars = { user: users[req.session['user_id']] };
  if (templateVars.user === undefined) {
    res.redirect("/urls/login");
  } else {
    res.redirect("/urls");
  }
});

// Takes user to the home page
app.get("/urls", (req, res) => {
  // function which uses the user_id to verfify that urls belong to the logged in user
  const urlsForUser = function() {
    let userURLDatabase = {};
    for (let key in urlDatabase) {
      let shortURL = urlDatabase[key];
      if (shortURL.userID === req.session['user_id']) {
        userURLDatabase[key] = urlDatabase[key];
      }
    }
    return userURLDatabase;
  };
  let templateVars = { urls: urlsForUser(urlDatabase), user: users[req.session['user_id']] };
  res.render("urls_index", templateVars);
});

// Takes user to a page to create a new URL
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session['user_id']] };
  if (templateVars.user === undefined) {
    res.redirect("/urls/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// Takes user to the register page
app.get("/urls/register", (req, res) => {
  let templateVars = { user: users[req.session['user_id']] };
  if (templateVars.user === undefined) {
    return res.render("user_registration", templateVars);
  } else {
    return res.redirect("/urls"); // If user tries to access register page while logged in, redirect to home page
  }
});

// Takes user to the login page
app.get("/urls/login", (req, res) => {
  let templateVars = { user: users[req.session['user_id']] };
  if (templateVars.user === undefined) {
    return res.render("user_login", templateVars);
  } else {
    return res.redirect("/urls"); // If user tries to access login page while logged in, redirect to home page
  }
});

// Takes user to the page to view/update the created short url and its corresponding long url
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session['user_id']], fakeUser: urlDatabase[req.params.shortURL].userID };
    return res.render("urls_show", templateVars);
  } else {
    return res.sendStatus(404); // If user tries to access a short url that doesn't exist, send back a response with the 400 status code.
  }
});

// Ability for user to login with login form and button
app.post("/urls/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  if (user !== undefined && bcrypt.compareSync(req.body.password, user.password)) {
    req.session['user_id'] = user.id;
    return res.redirect("/urls");
  }
  return res.sendStatus(403);
});

// Ability for user to logout with logout button
app.post("/urls/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Ability for user to register with login form and button
app.post("/urls/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  }
  let user = getUserByEmail(req.body.email, users);
  if (user === undefined) {
    let randomUserId = generateRandomString();
    let hashPassword = bcrypt.hashSync((req.body.password), 10);
    users[randomUserId] = { id: randomUserId, email: req.body.email, password: hashPassword};
    req.session['user_id'] = users[randomUserId].id; // After adding the user, set a user_id cookie containing the user's newly generated ID.
    return res.redirect("/urls"); // Redirect the user to the /urls page.
  } else {
    return res.sendStatus(400); // If user tries to register with an email that is already in the users object, send back a response with the 400 status code.
  }
});

// Ability for user to update short urls with a different long url using the update button
app.post("/urls/:shortURL", (req, res) => {
  let currentUser = req.session['user_id'];
  let urlOwner = urlDatabase[req.params.shortURL].userID;
  if (currentUser === urlOwner) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  }
  res.redirect("/urls");
});

// Ability for user to create new short urls
app.post("/urls", (req, res) => {
  let createdShortUrl = generateRandomString();
  urlDatabase[createdShortUrl] = { longURL: req.body.longURL, userID: req.session['user_id'] };
  res.redirect(`/urls/${createdShortUrl}`);
});

// Takes you to the long url of the corresponding short url parameter that was entered
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  } else {
    return res.sendStatus(404);
  }
});

// Ability for user to delete urls with the delete button
app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = req.session['user_id'];
  let urlOwner = urlDatabase[req.params.shortURL].userID;
  if (currentUser === urlOwner) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});