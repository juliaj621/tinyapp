const express = require("express");
var cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs"); // tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  'ak49d2' : { id: 'ak49d2', 
  email: "juliaj621@gmail.com", 
  password: "hello"}
  
}

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
  let templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  console.log(templateVars.user)
  console.log(users)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

app.get("/urls/register", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  res.render("user_registration", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

app.post("/urls/login", (req, res) => {
  for (let key in users) {
    const user = users[key]
    if(req.body.email === user.email) {
      res.cookie('user_id', user.id)
    }
  }
  res.redirect("/urls");
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls");
});

app.post("/urls/register", (req, res) => {
  let randomUserId = generateRandomString();
  users[randomUserId] = { id: randomUserId, email: req.body.email, password: req.body.password}
  for (let key in users) {
    if (req.body.email === "" || req.body.password === "" || req.body.email === users[key].email) {
      // If the e-mail or password are empty strings or if someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
      res.sendStatus(400)
    } else {
      // After adding the user, set a user_id cookie containing the user's newly generated ID.
      res.cookie('user_id', users[randomUserId].id);
      // Test that the users object is properly being appended to. 
      console.log(users)
      // Redirect the user to the /urls page.
      res.redirect("/urls");
    }
  }
  // Consider creating an email lookup helper function to keep your code DRY
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let createdShortUrl = generateRandomString();
  urlDatabase[createdShortUrl] = req.body.longURL; // Adds longURL and newly created shortURL to urlDatabase object
  console.log(urlDatabase); // Log the updated object to the console
  res.redirect(`/urls/${createdShortUrl}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
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


// Edge Cases:
// What would happen if a client requests a non-existent shortURL?
// What happens to the urlDatabase when the server is restarted?
// What type of status code do our redirects have? What does this status code mean?