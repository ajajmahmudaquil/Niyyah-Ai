import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { format, subDays, startOfWeek, differenceInDays } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const MAIN_ADMIN_EMAIL = process.env.MAIN_ADMIN_EMAIL || "";

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password || password.length < 6) {
        return res.status(400).json({ message: "Valid email and password (6+ chars) required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed });

      if (MAIN_ADMIN_EMAIL && email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
        await storage.updateUserRole(user.id, "admin");
        user.role = "admin";
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
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
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Valid passwords required" });
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

  app.get("/api/dashboard/stats", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const prayerLogs = await storage.getPrayerLogsForStreak(userId);
      const problemLogs = await storage.getProblemLogsForStreak(userId);

      const prayerStreak = calculatePrayerStreak(prayerLogs);
      const problemStreak = calculateProblemStreak(problemLogs);

      const todayPrayer = await storage.getPrayerLog(userId, today);
      const todayPrayers = todayPrayer
        ? [todayPrayer.fajr, todayPrayer.dhuhr, todayPrayer.asr, todayPrayer.maghrib, todayPrayer.isha].filter(Boolean).length
        : 0;

      const todayProblem = await storage.getProblemLog(userId, today);
      const todayProblems = todayProblem?.solvedCount ?? 0;

      const notesList = await storage.getNotes(userId);
      const todayNotes = notesList.filter((n) => n.date === today).length;

      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
      const weeklyPrayerLogs = prayerLogs.filter((l) => last7Days.includes(l.date));
      const weeklyPrayerComplete = weeklyPrayerLogs.filter(
        (l) => l.fajr && l.dhuhr && l.asr && l.maghrib && l.isha
      ).length;
      const weeklyPrayerPercent = last7Days.length > 0 ? Math.round((weeklyPrayerComplete / 7) * 100) : 0;

      const weeklyProblems = problemLogs
        .filter((l) => last7Days.includes(l.date))
        .reduce((sum, l) => sum + l.solvedCount, 0);

      const weeklyNotes = notesList.filter((n) => last7Days.includes(n.date)).length;

      const prayerScore = weeklyPrayerPercent;
      const problemDaysWithSolved = problemLogs.filter((l) => last7Days.includes(l.date) && l.solvedCount > 0).length;
      const problemScore = Math.round((problemDaysWithSolved / 7) * 100);
      const notesDays = new Set(notesList.filter((n) => last7Days.includes(n.date)).map((n) => n.date)).size;
      const notesScore = Math.round((notesDays / 7) * 100);

      const consistencyScore = prayerScore * 0.5 + problemScore * 0.35 + notesScore * 0.1 + 0 * 0.05;

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

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    const aiEnabled = process.env.AI_ENABLED !== "false";
    if (!aiEnabled) {
      return res.json({
        response: "AI Coach is currently disabled. To enable it, set the AI_ENABLED environment variable to 'true' and configure your AI provider. You can still track your progress manually!",
      });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    return res.json({
      response: `AI Coach is not yet configured with an AI provider. To set it up:\n\n1. Set AI_ENABLED=true\n2. Set AI_PROVIDER to 'openai' or 'custom_http'\n3. Set the appropriate API key (OPENAI_API_KEY or CUSTOM_AI_API_KEY)\n\nIn the meantime, keep up your great work! Track your prayers, solve problems, and write notes daily. Consistency is key! 💪\n\nYour message: "${message}"`,
    });
  });

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

  return httpServer;
}

function calculatePrayerStreak(logs: any[]) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalDays = sorted.length;

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
      }
    } else {
      if (i === 0) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }

  if (sorted.length > 0 && sorted[0].date === today) {
    currentStreak = tempStreak > currentStreak ? tempStreak : currentStreak;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
  const weeklyComplete = sorted.filter(
    (l) => last7Days.includes(l.date) && l.fajr && l.dhuhr && l.asr && l.maghrib && l.isha
  ).length;
  const weeklyPercent = Math.round((weeklyComplete / 7) * 100);

  return { currentStreak, longestStreak, weeklyPercent, totalDays };
}

function calculateProblemStreak(logs: any[]) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    if (log.solvedCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (i === 0 && (log.date === today || log.date === yesterday)) {
        currentStreak = tempStreak;
      }
    } else {
      if (i === 0) currentStreak = 0;
      tempStreak = 0;
    }
  }

  if (sorted.length > 0 && sorted[0].date === today) {
    currentStreak = tempStreak > currentStreak ? tempStreak : currentStreak;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
  const weeklyTotal = sorted
    .filter((l) => last7Days.includes(l.date))
    .reduce((sum, l) => sum + l.solvedCount, 0);

  return { currentStreak, longestStreak, weeklyTotal };
}
