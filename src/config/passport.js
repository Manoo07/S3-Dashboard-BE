const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Adjust the path as needed

console.log(process.env.GOOGLE_CLIENT_ID);
console.log("Hello test")

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
              done(null, user);
          } else {
              user = await new User({
                  googleId: profile.id,
                  username: profile.displayName,
                  thumbnail: profile._json.picture
              }).save();
              done(null, user);
          }
      } catch (error) {
          console.error(error);
          done(error, null);
      }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});
