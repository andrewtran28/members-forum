require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const path = require("node:path");
const appRouter = require("./routes/appRouter");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //1 day in milliseconds
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", appRouter);

app.use((req, res) => {
  res.status(404).render("error404");
});

const PORT = process.env.PORT || 3000;
app.listen(process.env.PORT, () => {
  console.log(
    `Express App - Listening on port http://localhost:${process.env.PORT}`
  );
});
