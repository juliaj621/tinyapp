const express = require("express");
var cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs"); // tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: 'ak49d2' },
  "9sm5xK": { longURL: "http://www.google.com", userID: 'sn59dj' }
};

const users = { 
  'ak49d2' : { id: 'ak49d2', 
  email: "juliaj621@gmail.com", 
  password: "hello"},

  'sn59dj' : { id: 'sn59dj', 
  email: "j@gmail.com", 
  password: "password"}
  
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const urlsForUser = function () {
    let userURLDatabase = {}
    for (let key in urlDatabase) {
      let shortURL = urlDatabase[key]
      // for (let user in users) {
        if (shortURL.userID === req.cookies['user_id']) {
          userURLDatabase[key] = urlDatabase[key]
        }
    }
    return userURLDatabase
  };
  let templateVars = { urls: urlsForUser(urlDatabase), user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  if (templateVars.user === undefined) {
    res.redirect("/urls/login")
  } else {
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/register", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  res.render("user_registration", templateVars)
});

app.get("/urls/login", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  res.render("user_login", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies['user_id']], fakeUser: urlDatabase[req.params.shortURL].userID };
  console.log(templateVars.user)
  res.render("urls_show", templateVars);
});

app.post("/urls/login", (req, res) => {
  for (let key in users) {
    const user = users[key]
    if (req.body.email === user.email && req.body.password === user.password) {
      res.cookie('user_id', user.id)
      return res.redirect("/urls");
    }
  }
  return res.sendStatus(403)  
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls");
});

app.post("/urls/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400) // If the e-mail or password are empty strings, send back a response with the 400 status code.
  }  
  for (let key in users) {
    if (req.body.email === users[key].email) {
      return res.sendStatus(400) // If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
    } 
  }
  let randomUserId = generateRandomString();
  users[randomUserId] = { id: randomUserId, email: req.body.email, password: req.body.password} 
  res.cookie('user_id', users[randomUserId].id); // After adding the user, set a user_id cookie containing the user's newly generated ID.
  res.redirect("/urls"); // Redirect the user to the /urls page.
  // Consider creating an email lookup helper function to keep your code DRY
});

app.post("/urls/:shortURL", (req, res) => {
  let currentUser = req.cookies['user_id']
  let urlOwner = urlDatabase[req.params.shortURL].userID
  if (currentUser === urlOwner) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  } 
  res.redirect("/urls");
}); 

app.post("/urls", (req, res) => {
  let createdShortUrl = generateRandomString();
  urlDatabase[createdShortUrl] = { longURL: req.body.longURL, userID: req.cookies['user_id'] } ; // Adds longURL and newly created shortURL to urlDatabase object
  // console.log(urlDatabase)
  res.redirect(`/urls/${createdShortUrl}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = req.cookies['user_id']
  let urlOwner = urlDatabase[req.params.shortURL].userID
  if (currentUser === urlOwner) {
  delete urlDatabase[req.params.shortURL];
  }  
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/*
In order to simulate generating a "unique" shortURL, for now we will implement
a function that returns a string of 6 random alphanumeric characters:
*/
const generateRandomString =  function() {
  let string = Math.random().toString(36).slice(-6);
  return string;
};