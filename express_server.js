const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require('./helpers');


app.set("view engine", "ejs"); //view engine
app.use(express.urlencoded({ extended: true })); //middleware
app.use(cookieSession({
  name: 'session',
  keys: ["string"],
  
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
  const newUser = { // Create a new user object
    id: userId,
    email: email,
    password: hashedPassword,
  };
  
  users[userId] = newUser; // // Add the new user to the users object
  
  req.session.user_id = userId;
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
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register");
    return;
  }
  const userURLs = urlsForUser(userId); // Get URLs for the logged-in user
  const templateVars = {
    urls: userURLs, // Pass the user's URLs to the template
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register to view this");
    return;
  }

  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(403).send("Access Denied");
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL, // Access the longURL property
    user: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register to edit this URL.");
    return;
  }
  
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  
  if (!url || url.userID !== userId) {
    res.status(403).send("Access Denied");
    return;
  }
  
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => { // POST route to delete a URL resource
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register to delete this URL.");
    return;
  }
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(403).send("Access Denied. You do not have permission to delete this URL.");
    return;
  }
  // Delete the URL from the database
  delete urlDatabase[shortURL];

  res.redirect("/urls");
});


app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
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
  const user = getUserByEmail(email, users); // Look up the user by email
  if (!user) {    // Check if a user with that email exists
    res.status(403).send("User not found");
    return;
  }
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    res.status(403).send("Invalid email or password");
    return;
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // res.clearCookie("user_id"); //Clear the user_id cookie
  req.session = null;
  res.redirect("/login"); // Redirect the user to the login page
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls'); // User is already logged in, redirect to /urls
  } else {
    const templateVars = {
      user: null
    };
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    // User is already logged in, redirect to /urls
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: req.session.user_id
    };
    res.render('urls_login', templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Please log in or register to edit this URL.");
    return;
  }
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  if (!url || url.userID !== userId) {
    res.status(403).send("Access Denied. You do not have permission to edit this URL.");
    return;
  }
  // Update the URL with the edited data
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});
  
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
