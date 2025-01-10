const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const app = express();
// const session = require("express-session");
// const passport = require("passport");
const appRouter = require("./routes/appRouter");
// const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use("/sign-up", appRouter);
app.use("/", appRouter);

// app.use(
//   session({
//     secret: "cats",
//     resave: false,
//     saveUninitialized: false,
//   })
// );
// app.use(passport.session());

app.use((req, res) => {
  res.status(404).render("error404");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express app - listening on port http://localhost:${PORT}`);
});
