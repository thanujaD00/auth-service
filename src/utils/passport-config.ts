import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user.model";
import { IUser } from "../models/user.model";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const tokens = await User.login(email, password);

        // Return dummy user just to satisfy Passport
        const userForPassport = {
          id: tokens.accessToken, // dummy or useful unique field
          firstName: tokens.firstName,
          lastName: tokens.lastName,
          role: tokens.role,
        };

        return done(null, userForPassport as IUser); // Force type match
      } catch (e) {
        return done(e);
      }
    }
  )
);

// JWT strategy for token authentication
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "jwt_secret",
    },
    async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
