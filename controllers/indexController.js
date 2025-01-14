require("dotenv").config();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const query = require("../db/queries.js");
const { validationResult } = require("express-validator");

const getFormattedDate = (date) => {
  const options = { month: "short" };
  const month = new Intl.DateTimeFormat("en-US", options).format(date);
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() < 12 ? "AM" : "PM";

  const timezone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
    .format(date)
    .split(" ")
    .pop();

  return `${month} ${day}, ${year} @ ${hours}:${minutes}${ampm} ${timezone}`;
};

const getIndex = asyncHandler(async (req, res) => {
  let messages = await query.getAllMessages();

  messages = messages.map((message) => ({
    ...message,
    timestamp: getFormattedDate(message.timestamp),
  }));

  res.render("index", {
    title: "Message Forum",
    messages: messages,
  });
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
  req.logout((err) => {
    if (err) {
      console.error("Error during logout: ", err);
      return next(err);
    }
    res.redirect("/");
  });
};

const getUserPage = asyncHandler(async (req, res) => {
  if (res.locals.currentUser.user_id !== parseInt(req.params.id)) {
    return res.status(403).json({ success: false, message: "Forbidden: You can only view your own user page if you are logged in."});
  }

  res.render("userPage", { user: res.locals.currentUser });
});

const changeUserMembership = asyncHandler(async (req, res) => {
  const currentUser = res.locals.currentUser;
  if(!currentUser.super_member && (req.body.superMember == process.env.SUPER_PASSPHRASE)) {
    await query.updateUser("TRUE", res.locals.currentUser.user_id);
  } else if (res.locals.currentUser.super_member) {
    await query.updateUser("FALSE", currentUser.user_id);
  }

  res.redirect(`/user/${currentUser.user_id}`);
});

const deleteUser = asyncHandler(async (req, res) => {
  if(res.locals.currentUser) {
    await query.deleteUser(res.locals.currentUser.user_id);
  }

  res.redirect("/");
});

const getNewMessage = asyncHandler(async (req, res) => {
  if (res.locals.currentUser) {
    res.render("newMessage", {
      title: "New Message",
      errors: null,
    });
  } else {
    res.redirect("/login");
  }
});

const submitNewMessage = asyncHandler(async (req, res) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    query.addMessage(
      res.locals.currentUser.user_id,
      req.body.subject,
      req.body.message,
    );
    res.redirect("/");
  } else {
    res.render("newMessage", { title: "New Message", errors: result.array() });
  }
});

const deleteMessage = asyncHandler (async(req, res) => {
  const currentUser = res.locals.currentUser;
  const { message_id } = req.body;
  const message = await query.getMessageById(message_id);

  if(message.user_id !== currentUser.user_id && !currentUser.super_member) {
    return res.status(403).json( { success: false, error: "Forbidden. You do not have permission to delete this message."})
  }

  await query.deleteMessageById(message_id);
  res.redirect("/");
});

module.exports = {
  getIndex,
  getSignUp,
  submitSignUp,
  getLogIn,
  getUserPage,
  changeUserMembership,
  deleteUser,
  handleLogOut,
  getNewMessage,
  submitNewMessage,
  deleteMessage,
};
