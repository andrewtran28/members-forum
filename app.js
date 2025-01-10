require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("./routes/passport");
const path = require("node:path");
const appRouter = require("./routes/appRouter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); //should be false?
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true, //was originally false
  })
);
// app.use(passport.initialize());
app.use(passport.session());

app.use("/", appRouter);
app.use((req, res) => {
  res.status(404).render("error404");
});

app.listen(PORT, () => {
  console.log(`Express app - listening on port http://localhost:${PORT}`);
});
