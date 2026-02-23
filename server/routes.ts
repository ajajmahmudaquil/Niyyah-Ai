import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireVerified, requireAdmin } from "./auth";
import { isDisposableEmail } from "./disposableDomains";
import { format, subDays, startOfWeek, differenceInDays } from "date-fns";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "avatars");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user!.id}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const strongPasswordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

function validateStrongPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!strongPasswordRegex.uppercase.test(password)) return "Must contain at least 1 uppercase letter";
  if (!strongPasswordRegex.lowercase.test(password)) return "Must contain at least 1 lowercase letter";
  if (!strongPasswordRegex.number.test(password)) return "Must contain at least 1 number";
  if (!strongPasswordRegex.special.test(password)) return "Must contain at least 1 special character";
  return null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(process.cwd(), "uploads", req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  const MAIN_ADMIN_EMAIL = process.env.MAIN_ADMIN_EMAIL || "";

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, password, and full name are required" });
      }

      if (!fullName || fullName.trim().length < 1) {
        return res.status(400).json({ message: "Full name is required" });
      }

      const passwordError = validateStrongPassword(password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      if (isDisposableEmail(email)) {
        return res.status(400).json({ message: "Please use a real email address (disposable emails are not allowed)." });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed, fullName: fullName.trim() });

      if (MAIN_ADMIN_EMAIL && email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
        await storage.updateUserRole(user.id, "admin");
        user.role = "admin";
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createEmailVerificationToken(user.id, verificationToken, expiresAt);

      await storage.createDefaultTargets(user.id);

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        storage.createEvent({
          userId: user.id,
          sessionId: req.sessionID,
          eventName: "signup_completed",
          path: "/signup",
          referrer: req.headers.referer || null,
          userAgent: req.headers["user-agent"] || null,
          ipHash: hashIp(req.ip || ""),
        });
        return res.json({
          ...safeUser,
          verificationToken: process.env.NODE_ENV === "development" ? verificationToken : undefined,
        });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/verify-email", async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Verification token is required" });

      const record = await storage.getEmailVerificationToken(token);
      if (!record) return res.status(400).json({ message: "Invalid verification token" });
      if (record.usedAt) return res.status(400).json({ message: "Token already used" });
      if (new Date() > record.expiresAt) return res.status(400).json({ message: "Token has expired" });

      await storage.setEmailVerified(record.userId);
      await storage.markEmailVerificationTokenUsed(record.id);

      res.json({ message: "Email verified successfully" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/resend-verification", requireAuth, async (req, res, next) => {
    try {
      if (req.user!.emailVerified) {
        return res.json({ message: "Email already verified" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createEmailVerificationToken(req.user!.id, verificationToken, expiresAt);

      res.json({
        message: "Verification email sent. Check your inbox.",
        token: process.env.NODE_ENV === "development" ? verificationToken : undefined,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        storage.createEvent({
          userId: user.id,
          sessionId: req.sessionID,
          eventName: "login_success",
          path: "/login",
          referrer: req.headers.referer || null,
          userAgent: req.headers["user-agent"] || null,
          ipHash: hashIp(req.ip || ""),
        });
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user!.status !== "active") {
      req.logout(() => {});
      return res.status(403).json({ message: `Account is ${req.user!.status}` });
    }
    const { password: _, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  app.post("/api/auth/set-username", requireAuth, async (req, res, next) => {
    try {
      const { username } = req.body;
      if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: "Username must be 3-20 chars, letters/numbers/underscores only" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing && existing.id !== req.user!.id) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const updated = await storage.updateUsername(req.user!.id, username);
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      const passwordError = validateStrongPassword(newPassword);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updatePassword(user.id, hashed);
      res.json({ message: "Password updated" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "Email or username is required" });
      }

      let user;
      if (identifier.includes("@")) {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return res.json({ message: "If this email exists, we sent a reset link." });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      res.json({
        message: "If this email exists, we sent a reset link.",
        token: process.env.NODE_ENV === "development" ? token : undefined,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password required" });
      }

      const passwordError = validateStrongPassword(newPassword);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) return res.status(400).json({ message: "Invalid or expired reset token" });
      if (resetToken.usedAt) return res.status(400).json({ message: "This reset token has already been used" });
      if (new Date() > resetToken.expiresAt) return res.status(400).json({ message: "Reset token has expired" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updatePassword(resetToken.userId, hashed);
      await storage.markTokenUsed(resetToken.id);

      res.json({ message: "Password has been reset successfully" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/profile/update", requireAuth, async (req, res, next) => {
    try {
      const { fullName, bio, currency, timezone } = req.body;
      const updated = await storage.updateProfile(req.user!.id, { fullName, bio, currency, timezone });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/profile/avatar", requireAuth, upload.single("avatar"), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await storage.updateAvatarUrl(req.user!.id, avatarUrl);
      res.json({ avatarUrl });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/prayers/streak", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getPrayerLogsForStreak(req.user!.id);
      const result = calculatePrayerStreak(logs);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/prayers/month/:yearMonth", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getPrayerLogsByMonth(req.user!.id, req.params.yearMonth);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/prayers/:date", requireAuth, async (req, res, next) => {
    try {
      const log = await storage.getPrayerLog(req.user!.id, req.params.date);
      res.json(log || null);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/prayers", requireAuth, async (req, res, next) => {
    try {
      const log = await storage.upsertPrayerLog(req.user!.id, req.body);
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "prayer_checkin",
        path: "/prayers",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/problems/streak", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getProblemLogsForStreak(req.user!.id);
      const result = calculateProblemStreak(logs);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/problems/chart", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getProblemLogsForChart(req.user!.id, 7);
      const chartData = logs.map((l) => ({
        date: format(new Date(l.date), "MMM d"),
        count: l.solvedCount,
      }));
      res.json(chartData);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/problems/:date", requireAuth, async (req, res, next) => {
    try {
      const log = await storage.getProblemLog(req.user!.id, req.params.date);
      res.json(log || null);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/problems", requireAuth, async (req, res, next) => {
    try {
      const log = await storage.upsertProblemLog(req.user!.id, req.body);
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "problem_logged",
        path: "/problems",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/notes", requireAuth, async (req, res, next) => {
    try {
      const notesList = await storage.getNotes(req.user!.id);
      res.json(notesList);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/notes", requireAuth, async (req, res, next) => {
    try {
      const note = await storage.createNote(req.user!.id, req.body);
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "note_saved",
        path: "/notes",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(note);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteNote(req.user!.id, req.params.id);
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  });

  // New Targets API
  app.get("/api/targets", requireAuth, async (req, res, next) => {
    try {
      const targetsList = await storage.getTargets(req.user!.id);
      if (targetsList.length === 0) {
        await storage.createDefaultTargets(req.user!.id);
        const defaults = await storage.getTargets(req.user!.id);
        return res.json(defaults);
      }
      res.json(targetsList);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/targets", requireAuth, async (req, res, next) => {
    try {
      const { title, type, unit, targetValue, active } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });
      const target = await storage.createTarget(req.user!.id, {
        title, type: type || "daily", unit, targetValue: targetValue || 1, active: active !== false,
      });
      res.json(target);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/targets/:id", requireAuth, async (req, res, next) => {
    try {
      const target = await storage.updateTarget(req.user!.id, req.params.id, req.body);
      res.json(target);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/targets/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteTarget(req.user!.id, req.params.id);
      res.json({ message: "Target deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/targets/logs/daily/:date", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getTargetLogsDaily(req.user!.id, req.params.date);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/targets/logs/daily", requireAuth, async (req, res, next) => {
    try {
      const { targetId, date, actualValue } = req.body;
      if (!targetId || !date) return res.status(400).json({ message: "Target ID and date required" });
      const log = await storage.upsertTargetLogDaily(req.user!.id, targetId, date, actualValue || 0);
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "target_complete",
        path: "/targets",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/targets/logs/weekly/:weekStart", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getTargetLogsWeekly(req.user!.id, req.params.weekStart);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/targets/logs/weekly", requireAuth, async (req, res, next) => {
    try {
      const { targetId, weekStart, actualValue } = req.body;
      if (!targetId || !weekStart) return res.status(400).json({ message: "Target ID and week start required" });
      const log = await storage.upsertTargetLogWeekly(req.user!.id, targetId, weekStart, actualValue || 0);
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  // Legacy targets routes (kept for backward compatibility)
  app.get("/api/targets/daily/:date", requireAuth, async (req, res, next) => {
    try {
      const target = await storage.getDailyTarget(req.user!.id, req.params.date);
      res.json(target || null);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/targets/daily", requireAuth, async (req, res, next) => {
    try {
      const target = await storage.upsertDailyTarget(req.user!.id, req.body);
      res.json(target);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/targets/weekly/:weekStart", requireAuth, async (req, res, next) => {
    try {
      const target = await storage.getWeeklyTarget(req.user!.id, req.params.weekStart);
      res.json(target || null);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/targets/weekly", requireAuth, async (req, res, next) => {
    try {
      const target = await storage.upsertWeeklyTarget(req.user!.id, req.body);
      res.json(target);
    } catch (err) {
      next(err);
    }
  });

  // Finance routes
  app.get("/api/finance/settings", requireAuth, async (req, res, next) => {
    try {
      const settings = await storage.getFinanceSettings(req.user!.id);
      res.json(settings || { userId: req.user!.id, startingBalance: "0", updatedAt: new Date() });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/finance/settings", requireAuth, async (req, res, next) => {
    try {
      const { startingBalance } = req.body;
      const settings = await storage.upsertFinanceSettings(req.user!.id, String(startingBalance || 0));
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/finance/summary", requireAuth, async (req, res, next) => {
    try {
      const summary = await storage.getFinanceSummary(req.user!.id);
      const currentBalance = summary.startingBalance + summary.totalIncome - summary.totalExpense;
      res.json({ ...summary, currentBalance });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/finance/income", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getIncomeLogs(req.user!.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/finance/income", requireAuth, async (req, res, next) => {
    try {
      const { date, amount, source, note } = req.body;
      if (!date || !amount) return res.status(400).json({ message: "Date and amount required" });
      const log = await storage.createIncomeLog(req.user!.id, { date, amount: String(amount), source, note });
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "finance_income",
        path: "/finance",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/finance/income/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteIncomeLog(req.user!.id, req.params.id);
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/finance/expense", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getExpenseLogs(req.user!.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/finance/expense", requireAuth, async (req, res, next) => {
    try {
      const { date, amount, category, note } = req.body;
      if (!date || !amount) return res.status(400).json({ message: "Date and amount required" });
      const log = await storage.createExpenseLog(req.user!.id, { date, amount: String(amount), category, note });
      storage.createEvent({
        userId: req.user!.id,
        sessionId: req.sessionID,
        eventName: "finance_expense",
        path: "/finance",
        referrer: null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });
      res.json(log);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/finance/expense/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteExpenseLog(req.user!.id, req.params.id);
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/finance/chart", requireAuth, async (req, res, next) => {
    try {
      const data = await storage.getMonthlyFinanceData(req.user!.id, 6);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const today = format(new Date(), "yyyy-MM-dd");

      const prayerLogsList = await storage.getPrayerLogsForStreak(userId);
      const problemLogsList = await storage.getProblemLogsForStreak(userId);

      const prayerStreak = calculatePrayerStreak(prayerLogsList);
      const problemStreak = calculateProblemStreak(problemLogsList);

      const todayPrayer = await storage.getPrayerLog(userId, today);
      const todayPrayers = todayPrayer
        ? [todayPrayer.fajr, todayPrayer.dhuhr, todayPrayer.asr, todayPrayer.maghrib, todayPrayer.isha].filter(Boolean).length
        : 0;

      const todayProblem = await storage.getProblemLog(userId, today);
      const todayProblems = todayProblem?.solvedCount ?? 0;

      const notesList = await storage.getNotes(userId);
      const todayNotes = notesList.filter((n) => n.date === today).length;

      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
      const weeklyPrayerLogs = prayerLogsList.filter((l) => last7Days.includes(l.date));
      const weeklyPrayerComplete = weeklyPrayerLogs.filter(
        (l) => l.fajr && l.dhuhr && l.asr && l.maghrib && l.isha
      ).length;
      const weeklyPrayerPercent = Math.round((weeklyPrayerComplete / 7) * 100);

      const weeklyProblems = problemLogsList
        .filter((l) => last7Days.includes(l.date))
        .reduce((sum, l) => sum + l.solvedCount, 0);

      const weeklyNotes = notesList.filter((n) => last7Days.includes(n.date)).length;

      // Consistency score with new weights: Prayer 35%, Problems 25%, Notes 10%, Targets 20%, Finance 10%
      const prayerScore = weeklyPrayerPercent;
      const problemDaysWithSolved = problemLogsList.filter((l) => last7Days.includes(l.date) && l.solvedCount > 0).length;
      const problemScore = Math.round((problemDaysWithSolved / 7) * 100);
      const notesDays = new Set(notesList.filter((n) => last7Days.includes(n.date)).map((n) => n.date)).size;
      const notesScore = Math.round((notesDays / 7) * 100);

      // Targets score
      let targetsScore = 0;
      try {
        const userTargets = await storage.getTargetsByType(userId, "daily");
        const activeTargets = userTargets.filter(t => t.active);
        if (activeTargets.length > 0) {
          let completedDays = 0;
          for (const day of last7Days) {
            const logs = await storage.getTargetLogsDaily(userId, day);
            const allCompleted = activeTargets.every(t => {
              const log = logs.find(l => l.targetId === t.id);
              return log && log.completed;
            });
            if (allCompleted) completedDays++;
          }
          targetsScore = Math.round((completedDays / 7) * 100);
        }
      } catch {}

      // Finance score - based on tracking activity
      let financeScore = 0;
      try {
        const yearMonth = format(new Date(), "yyyy-MM");
        const monthIncome = await storage.getIncomeLogsByMonth(userId, yearMonth);
        const monthExpense = await storage.getExpenseLogsByMonth(userId, yearMonth);
        const hasFinanceActivity = (monthIncome.length + monthExpense.length) > 0;
        financeScore = hasFinanceActivity ? 100 : 0;
      } catch {}

      const consistencyScore = Math.round(
        prayerScore * 0.35 + problemScore * 0.25 + notesScore * 0.10 + targetsScore * 0.20 + financeScore * 0.10
      );

      const daysSinceJoined = differenceInDays(new Date(), new Date(req.user!.createdAt));

      res.json({
        prayerStreak: prayerStreak.currentStreak,
        longestPrayerStreak: prayerStreak.longestStreak,
        problemStreak: problemStreak.currentStreak,
        longestProblemStreak: problemStreak.longestStreak,
        todayPrayers,
        todayProblems,
        todayNotes,
        weeklyPrayerPercent,
        weeklyProblems,
        weeklyNotes,
        consistencyScore,
        daysSinceJoined: Math.max(0, daysSinceJoined),
      });
    } catch (err) {
      next(err);
    }
  });

  // AI Coach
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    const aiEnabled = process.env.AI_ENABLED !== "false";
    if (!aiEnabled) {
      return res.json({
        response: "AI Coach is currently disabled. To enable it, set the AI_ENABLED environment variable to 'true' and configure your AI provider. You can still track your progress manually!",
      });
    }

    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    try {
      const { getAIResponse } = await import("./ai/index");
      const userId = req.user!.id;
      const response = await getAIResponse(message, userId, language);
      return res.json({ response });
    } catch (err: any) {
      return res.json({
        response: `AI Coach is not yet configured with an AI provider. To set it up:\n\n1. Set AI_ENABLED=true\n2. Set AI_PROVIDER to 'openai' or 'custom_http'\n3. Set the appropriate API key\n\nTo switch AI provider later, edit server/ai/config.ts\n\nYour message: "${message}"`,
      });
    }
  });

  app.post("/api/events", async (req, res, next) => {
    try {
      const { eventName, path, referrer, sessionId } = req.body;
      if (!eventName) {
        return res.status(400).json({ message: "Event name is required" });
      }

      await storage.createEvent({
        userId: req.isAuthenticated() ? req.user!.id : null,
        sessionId: sessionId || req.sessionID || null,
        eventName,
        path: path || null,
        referrer: referrer || null,
        userAgent: req.headers["user-agent"] || null,
        ipHash: hashIp(req.ip || ""),
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Admin routes
  app.get("/api/admin/overview", requireAdmin, async (req, res, next) => {
    try {
      const stats = await storage.getOverviewStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password: _, ...u }) => u);
      res.json(safeUsers);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/users/:userId", requireAdmin, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password: _, ...safeUser } = user;

      const prayerLogsList = await storage.getPrayerLogsByUser(user.id, 30);
      const problemLogsList = await storage.getProblemLogsByUser(user.id, 30);
      const notesList = await storage.getNotesByUser(user.id, 30);
      const dailyTargetsList = await storage.getDailyTargetsByUser(user.id, 10);
      const weeklyTargetsList = await storage.getWeeklyTargetsByUser(user.id, 10);

      const allPrayerLogs = await storage.getPrayerLogsForStreak(user.id);
      const allProblemLogs = await storage.getProblemLogsForStreak(user.id);
      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
      const weeklyPrayerComplete = allPrayerLogs.filter(
        (l) => last7Days.includes(l.date) && l.fajr && l.dhuhr && l.asr && l.maghrib && l.isha
      ).length;
      const prayerScore = Math.round((weeklyPrayerComplete / 7) * 100);
      const problemDaysWithSolved = allProblemLogs.filter((l) => last7Days.includes(l.date) && l.solvedCount > 0).length;
      const problemScore = Math.round((problemDaysWithSolved / 7) * 100);
      const notesDays = new Set(notesList.filter((n) => last7Days.includes(n.date)).map((n) => n.date)).size;
      const notesScore = Math.round((notesDays / 7) * 100);
      const consistencyScore = Math.round(prayerScore * 0.35 + problemScore * 0.25 + notesScore * 0.10);

      const financeSummary = await storage.getFinanceSummary(user.id);

      res.json({
        user: safeUser,
        prayerLogs: prayerLogsList,
        problemLogs: problemLogsList,
        notes: notesList,
        dailyTargets: dailyTargetsList,
        weeklyTargets: weeklyTargetsList,
        consistencyScore,
        prayerStreak: calculatePrayerStreak(allPrayerLogs),
        problemStreak: calculateProblemStreak(allProblemLogs),
        financeSummary,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/users/:userId/role", requireAdmin, async (req, res, next) => {
    try {
      const { role } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.updateUserRole(req.params.userId, role);
      res.json({ message: "Role updated" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/users/:userId/status", requireAdmin, async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["active", "suspended", "banned"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (req.params.userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot change your own status" });
      }
      await storage.updateUserStatus(req.params.userId, status);
      res.json({ message: "Status updated" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/users/:userId/reset-password", requireAdmin, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      res.json({ token, expiresAt: expiresAt.toISOString() });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/content/prayer/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.adminDeletePrayerLog(req.params.id);
      res.json({ message: "Prayer log deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/content/problem/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.adminDeleteProblemLog(req.params.id);
      res.json({ message: "Problem log deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/content/note/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.adminDeleteNote(req.params.id);
      res.json({ message: "Note deleted" });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/analytics", requireAdmin, async (req, res, next) => {
    try {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [pageviews24h, pageviews7d, pageviews30d, activeUsers7d, newSignups7d, retainedUsers7d, topPages, pageviewsTrend] = await Promise.all([
        storage.getEventsCount("page_view", h24),
        storage.getEventsCount("page_view", d7),
        storage.getEventsCount("page_view", d30),
        storage.getActiveUsersCount(d7),
        storage.getNewSignupsCount(d7),
        storage.getRetainedUsersCount(d7, 3),
        storage.getTopPages(d30, 10),
        storage.getEventsTrend("page_view", 30),
      ]);

      res.json({
        pageviews24h,
        pageviews7d,
        pageviews30d,
        activeUsers7d,
        newSignups7d,
        retainedUsers7d,
        topPages,
        pageviewsTrend,
      });
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "niyyah-salt").digest("hex").substring(0, 16);
}

function calculatePrayerStreak(logs: any[]) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const allComplete = log.fajr && log.dhuhr && log.asr && log.maghrib && log.isha;

    if (allComplete) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);

      if (i === 0 && (log.date === today || log.date === yesterday)) {
        currentStreak = tempStreak;
      } else if (i > 0) {
        const prevDate = sorted[i - 1].date;
        const expectedPrev = format(subDays(new Date(log.date), -1), "yyyy-MM-dd");
        if (prevDate !== expectedPrev) {
          currentStreak = Math.max(currentStreak, tempStreak);
        }
      }
    } else {
      if (currentStreak === 0 && i === 0) currentStreak = 0;
      tempStreak = 0;
    }
  }

  if (sorted.length > 0) {
    const firstLog = sorted[0];
    const allComplete = firstLog.fajr && firstLog.dhuhr && firstLog.asr && firstLog.maghrib && firstLog.isha;
    if (allComplete && (firstLog.date === today || firstLog.date === yesterday)) {
      let streak = 0;
      for (let i = 0; i < sorted.length; i++) {
        const log = sorted[i];
        const expectedDate = format(subDays(new Date(), i), "yyyy-MM-dd");
        const altExpected = format(subDays(new Date(), i + (firstLog.date === yesterday ? 1 : 0)), "yyyy-MM-dd");
        if ((log.date === expectedDate || log.date === altExpected) && log.fajr && log.dhuhr && log.asr && log.maghrib && log.isha) {
          streak++;
        } else {
          break;
        }
      }
      currentStreak = streak;
    }
  }

  return { currentStreak, longestStreak };
}

function calculateProblemStreak(logs: any[]) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  if (sorted.length > 0) {
    const firstLog = sorted[0];
    if (firstLog.solvedCount > 0 && (firstLog.date === today || firstLog.date === yesterday)) {
      for (let i = 0; i < sorted.length; i++) {
        const log = sorted[i];
        if (log.solvedCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  let tempStreak = 0;
  for (const log of sorted) {
    if (log.solvedCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
