import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { storage } from "./storage";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string | null;
      role: string;
      status: string;
      password: string;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "lifeos-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "identifier" },
      async (identifier, password, done) => {
        try {
          let user;
          if (identifier.includes("@")) {
            user = await storage.getUserByEmail(identifier);
          } else {
            user = await storage.getUserByUsername(identifier);
          }

          if (!user) {
            return done(null, false, { message: identifier.includes("@") ? "Invalid email or password" : "Username not found" });
          }

          if (user.status !== "active") {
            const statusMsg = user.status === "banned" ? "Your account has been banned" : "Your account has been suspended";
            return done(null, false, { message: statusMsg });
          }

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user && user.status !== "active") {
        return done(null, undefined);
      }
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.status !== "active") {
    req.logout(() => {});
    return res.status(403).json({ message: "Account is " + req.user.status });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.status !== "active") {
    req.logout(() => {});
    return res.status(403).json({ message: "Account is " + req.user.status });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
