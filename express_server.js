const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //view engine
app.use(express.urlencoded({ extended: true })); //middleware
app.use(cookieParser());

// Implement to generate a random string of 6 alphanumeric characters
function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
 };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

// POST route to delete a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id; // Get the URL ID from the request parameters
  delete urlDatabase[id]; // Remove the URL from the urlDatabase using the delete operator
  res.redirect("/urls"); // Redirect the client back to the urls_index page
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); // Generate a random short URL id
  const longURL = req.body.longURL; // Get the longURL from the form submission
  urlDatabase[shortURL] = longURL; // Save the shortURL and longURL to the urlDatabase
  res.redirect(`/urls/${shortURL}`); // Redirect to the new short URL page
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // Get the longURL from the urlDatabase
  const newLongURL = req.body.longURL; // Get the updated long URL from the form submission
    
  urlDatabase[id] = newLongURL;  // Update the value of the stored long URL
  
  res.redirect(longURL); // Redirect to the longURL
});

app.post("/login", (req, res) => {
  const username = req.body.username; // Get the username from the form submission
  res.cookie("username", username); // Set the "username" cookie with the provided value
  res.redirect("/urls"); // Redirect the user back to the /urls page
});
  
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
