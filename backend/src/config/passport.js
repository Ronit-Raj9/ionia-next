// backend/src/config/passport.js

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import { Logger } from '../middlewares/error.middleware.js';

// 🔥 PASSPORT SERIALIZATION
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 🔥 GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        Logger.info('Google OAuth callback received', {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName
        });

        // Find or create user
        const user = await User.findOrCreateGoogleUser(profile);
        
        Logger.info('Google OAuth user processed successfully', {
          userId: user._id,
          email: user.email,
          isNewUser: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 60000
        });

        return done(null, user);
      } catch (error) {
        Logger.error('Google OAuth strategy error', {
          error: error.message,
          googleId: profile.id,
          email: profile.emails?.[0]?.value
        });
        return done(error, null);
      }
    }
  )
);

// 🔥 PASSPORT ERROR HANDLING
passport.use('google', passport.authenticate('google', {
  failureRedirect: '/login',
  failureFlash: true
}));

// 🔥 EXPORT CONFIGURED PASSPORT
export default passport;
