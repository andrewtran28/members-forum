const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const query = require("../db/queries.js");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log("Authenticating user: ", username);
      const user = await query.getUserByUsername(username);
      console.log("user: ");
      console.log(user);
      const match = await bcrypt.compare(password, user.password);

      if (!user) {
        console.log(notValidMsg);
        return done(null, false, {
          message: "Incorrect username.",
        });
      }

      if (!match) {
        console.log(notValidMsg);
        return done(null, false, {
          message: "Incorrect password.",
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
  console.log("Deserializing user with ID:", id);
  try {
    const user = await query.getUserById(id);
    console.log("User fetched during deserialization:", user);
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err);
    done(err);
  }
});

module.exports = passport;
