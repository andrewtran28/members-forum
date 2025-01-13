const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const query = require("../db/queries.js");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log("Authenticating user: ", username);
      const user = await query.getUserByUsername(username);

      if (!user) {
        return done(null, false, {
          message: "Incorrect username or password.",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, {
          message: "Incorrect username or password.",
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
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await query.getUserById(id);
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
