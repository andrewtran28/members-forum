const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const query = require("../db/queries.js");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const [user] = await query.getUserByUsername(username);
      const validPassword = await bcrypt.compare(password, user.password);
      const notValidMsg = " Incorrect username or password.";

      if (!user) {
        return done(null, false, {
          message: notValidMsg,
        });
      }

      if (!validPassword) {
        return done(null, false, {
          message: notValidMsg,
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

//Save UserID in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [user] = await query.getUserById(id);

    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
