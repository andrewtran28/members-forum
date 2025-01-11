const express = require("express");
const appRouter = express.Router();
const passport = require("../config/passport");
const { validator } = require("../controllers/validator.js");
const indexController = require("../controllers/indexController");

appRouter.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

appRouter.get("/", indexController.getIndex);
appRouter.get("/signup", indexController.getSignUp);
appRouter.post("/signup", validator, indexController.submitSignUp);

appRouter.get("/login", indexController.getLogIn);
appRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  (req, res) => {
    console.log("Logged in as: ", req.user);
  }
);

appRouter.get("/logout", indexController.handleLogOut);

module.exports = appRouter;
