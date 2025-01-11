const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const query = require("../db/queries.js");
const { validationResult } = require("express-validator");

const getIndex = asyncHandler(async (req, res) => {
  res.render("index", {
    title: "Message Forum",
    user: req.user,
  });
  res.end();
});

const getSignUp = asyncHandler(async (req, res) => {
  res.render("signup", { title: "Sign-Up", errors: null });
  res.end();
});

const submitSignUp = asyncHandler(async (req, res) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    bcrypt.hash(req.body.password, 5, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      try {
        console.log(
          req.body.username,
          req.body.firstName,
          req.body.lastName,
          hashedPassword,
          req.body.superMember
        );
        query.addUser(
          req.body.username,
          req.body.firstName,
          req.body.lastName,
          hashedPassword,
          req.body.superMember
        );
        res.redirect("/");
      } catch (dbErr) {
        return next(dbErr);
      }
    });
  } else {
    res.render("signup", { title: "Sign-Up", errors: result.array() });
  }
});

const getLogIn = asyncHandler(async (req, res) => {
  res.render("login", { title: "User Login", errors: null });
});

const handleLogOut = (req, res, next) => {
  res.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

module.exports = {
  getIndex,
  getSignUp,
  submitSignUp,
  getLogIn,
  handleLogOut,
};
