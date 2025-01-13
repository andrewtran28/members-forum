const express = require("express");
const appRouter = express.Router();
const passport = require("../config/passport");
const {
  signupValidator,
  messageValidator,
} = require("../controllers/validator.js");
const indexController = require("../controllers/indexController");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to next route
  }
  res.redirect('/login'); // If not authenticated, redirect to login
};

appRouter.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

appRouter.get("/", indexController.getIndex);
appRouter.get("/signup", indexController.getSignUp);
appRouter.post("/signup", signupValidator, indexController.submitSignUp);

appRouter.get("/login", indexController.getLogIn);
appRouter.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).render("login", { title: "User Login", error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});

appRouter.get("/logout", indexController.handleLogOut);

appRouter.get("/user/:id", isAuthenticated, indexController.getUserPage);
appRouter.post("/user/:id/change", isAuthenticated, indexController.changeUserMembership);
appRouter.post("/user/:id/delete", isAuthenticated, indexController.deleteUser);

appRouter.get("/message/new", indexController.getNewMessage);
appRouter.post(
  "/message/new",
  messageValidator,
  indexController.submitNewMessage
);

appRouter.post("/deleteMessage", indexController.deleteMessage);

// appRouter.get("/user/:userid", indexController.getUserInfo);

module.exports = appRouter;
