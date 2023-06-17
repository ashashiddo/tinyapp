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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};
  
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function getUserByEmail(email) { // Helper function to look up a user by email
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

function urlsForUser(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}
  
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { // Check if the email or password is missing
    res.status(400).send("Email and password are required");
    return;
  }
  for (const userId in users) { // Check if the email already exists in the users object
    if (users[userId].email === email) {
      res.status(400).send("Email already registered");
      return;
    }
  }
  const userId = generateRandomString(); // Generate a random user ID
  const newUser = { // Create a new user object
    id: userId,
    email: email,
    password: password,
  };
  
  users[userId] = newUser; // // Add the new user to the users object
  
  res.cookie("user_id", userId); // Set the user_id cookie with the newly generated ID

  res.redirect("/urls"); // Redirect the user to the /urls page
});
    
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
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register");
    return;
  }
  const userURLs = urlsForUser(userId); // Get URLs for the logged-in user
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL, // Access the longURL property
    user: req.cookies.user_id
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => { // POST route to delete a URL resource
  const id = req.params.id; // Get the URL ID from the request parameters
  delete urlDatabase[id]; // Remove the URL from the urlDatabase using the delete operator
  res.redirect("/urls"); // Redirect the client back to the urls_index page
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).send("You need to be logged in to shorten URLs.");
    return;
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { // Save an object with longURL and userID properties
    longURL: longURL,
    userID: userId
  };
  res.redirect(`/urls/${shortURL}`); // Redirect to the new short URL page
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL] ? urlDatabase[shortURL].longURL : null; // Access the longURL property
  
  if (!longURL) {
    res.status(404).send("The requested short URL does not exist.");
    return;
  }
  
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {  // Check if the email or password is missing
    res.status(400).send("Email and password are required");
    return;
  }
  const user = getUserByEmail(email); // Look up the user by email
  if (!user) {    // Check if a user with that email exists
    res.status(403).send("User not found");
    return;
  }
  if (user.password !== password) {   // Check if the provided password matches the user's password
    res.status(403).send("Incorrect password");
    return;
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); //Clear the user_id cookie
  res.redirect("/login"); // Redirect the user to the login page
});

app.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect('/urls'); // User is already logged in, redirect to /urls
  } else {
    res.render("register");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    // User is already logged in, redirect to /urls
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: req.cookies.user_id
    };
    res.render('urls_login', templateVars);
  }
});
  
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
