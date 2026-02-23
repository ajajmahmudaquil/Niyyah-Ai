import { eq, and, desc, sql, gte, lte, count, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users, prayerLogs, problemLogs, notes, dailyTargets, weeklyTargets,
  passwordResetTokens, events,
  type User, type InsertUser, type PrayerLog, type InsertPrayerLog,
  type ProblemLog, type InsertProblemLog, type Note, type InsertNote,
  type DailyTarget, type InsertDailyTarget, type WeeklyTarget, type InsertWeeklyTarget,
  type Event, type InsertEvent, type PasswordResetToken,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string }): Promise<User>;
  updateUsername(userId: string, username: string): Promise<User>;
  updatePassword(userId: string, password: string): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<void>;
  updateUserStatus(userId: string, status: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenUsed(tokenId: string): Promise<void>;

  getPrayerLog(userId: string, date: string): Promise<PrayerLog | undefined>;
  upsertPrayerLog(userId: string, data: InsertPrayerLog): Promise<PrayerLog>;
  getPrayerLogsByMonth(userId: string, yearMonth: string): Promise<PrayerLog[]>;
  getPrayerLogsForStreak(userId: string): Promise<PrayerLog[]>;
  getPrayerLogsByUser(userId: string, limit?: number): Promise<PrayerLog[]>;

  getProblemLog(userId: string, date: string): Promise<ProblemLog | undefined>;
  upsertProblemLog(userId: string, data: InsertProblemLog): Promise<ProblemLog>;
  getProblemLogsForStreak(userId: string): Promise<ProblemLog[]>;
  getProblemLogsForChart(userId: string, days: number): Promise<ProblemLog[]>;
  getProblemLogsByUser(userId: string, limit?: number): Promise<ProblemLog[]>;

  getNotes(userId: string): Promise<Note[]>;
  createNote(userId: string, data: InsertNote): Promise<Note>;
  deleteNote(userId: string, noteId: string): Promise<void>;
  getNotesByUser(userId: string, limit?: number): Promise<Note[]>;
  adminDeleteNote(noteId: string): Promise<void>;
  adminDeletePrayerLog(logId: string): Promise<void>;
  adminDeleteProblemLog(logId: string): Promise<void>;

  getDailyTarget(userId: string, date: string): Promise<DailyTarget | undefined>;
  upsertDailyTarget(userId: string, data: InsertDailyTarget): Promise<DailyTarget>;
  getWeeklyTarget(userId: string, weekStart: string): Promise<WeeklyTarget | undefined>;
  upsertWeeklyTarget(userId: string, data: InsertWeeklyTarget): Promise<WeeklyTarget>;
  getDailyTargetsByUser(userId: string, limit?: number): Promise<DailyTarget[]>;
  getWeeklyTargetsByUser(userId: string, limit?: number): Promise<WeeklyTarget[]>;

  createEvent(data: InsertEvent): Promise<Event>;
  getEventsCount(eventName: string | null, since: Date): Promise<number>;
  getActiveUsersCount(since: Date): Promise<number>;
  getNewSignupsCount(since: Date): Promise<number>;
  getRetainedUsersCount(since: Date, minDays: number): Promise<number>;
  getTopPages(since: Date, limit: number): Promise<{ path: string; count: number }[]>;
  getEventsTrend(eventName: string, days: number): Promise<{ date: string; count: number }[]>;

  getOverviewStats(): Promise<any>;
  getUserCount(): Promise<number>;
  getTotalPrayerLogs(): Promise<number>;
  getTotalProblemLogs(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = ${username.toLowerCase()}`);
    return user;
  }

  async createUser(data: { email: string; password: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      password: data.password,
    }).returning();
    return user;
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    const [user] = await db.update(users).set({ username }).where(eq(users.id, userId)).returning();
    return user;
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    await db.update(users).set({ password }).where(eq(users.id, userId));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    await db.update(users).set({ status }).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [record] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return record;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return record;
  }

  async markTokenUsed(tokenId: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenId));
  }

  async getPrayerLog(userId: string, date: string): Promise<PrayerLog | undefined> {
    const [log] = await db.select().from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.date, date)));
    return log;
  }

  async upsertPrayerLog(userId: string, data: InsertPrayerLog): Promise<PrayerLog> {
    const existing = await this.getPrayerLog(userId, data.date);
    if (existing) {
      const [updated] = await db.update(prayerLogs)
        .set({ fajr: data.fajr, dhuhr: data.dhuhr, asr: data.asr, maghrib: data.maghrib, isha: data.isha, note: data.note })
        .where(eq(prayerLogs.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(prayerLogs)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async getPrayerLogsByMonth(userId: string, yearMonth: string): Promise<PrayerLog[]> {
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;
    return db.select().from(prayerLogs)
      .where(and(
        eq(prayerLogs.userId, userId),
        gte(prayerLogs.date, startDate),
        lte(prayerLogs.date, endDate),
      ))
      .orderBy(prayerLogs.date);
  }

  async getPrayerLogsForStreak(userId: string): Promise<PrayerLog[]> {
    return db.select().from(prayerLogs)
      .where(eq(prayerLogs.userId, userId))
      .orderBy(desc(prayerLogs.date))
      .limit(730);
  }

  async getPrayerLogsByUser(userId: string, limit = 30): Promise<PrayerLog[]> {
    return db.select().from(prayerLogs)
      .where(eq(prayerLogs.userId, userId))
      .orderBy(desc(prayerLogs.date))
      .limit(limit);
  }

  async getProblemLog(userId: string, date: string): Promise<ProblemLog | undefined> {
    const [log] = await db.select().from(problemLogs)
      .where(and(eq(problemLogs.userId, userId), eq(problemLogs.date, date)));
    return log;
  }

  async upsertProblemLog(userId: string, data: InsertProblemLog): Promise<ProblemLog> {
    const existing = await this.getProblemLog(userId, data.date);
    if (existing) {
      const [updated] = await db.update(problemLogs)
        .set({
          solvedCount: data.solvedCount,
          platform: data.platform,
          links: data.links,
          tags: data.tags,
          note: data.note,
        })
        .where(eq(problemLogs.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(problemLogs)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async getProblemLogsForStreak(userId: string): Promise<ProblemLog[]> {
    return db.select().from(problemLogs)
      .where(eq(problemLogs.userId, userId))
      .orderBy(desc(problemLogs.date))
      .limit(730);
  }

  async getProblemLogsForChart(userId: string, days: number): Promise<ProblemLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return db.select().from(problemLogs)
      .where(and(
        eq(problemLogs.userId, userId),
        gte(problemLogs.date, startDate.toISOString().split("T")[0]),
      ))
      .orderBy(problemLogs.date);
  }

  async getProblemLogsByUser(userId: string, limit = 30): Promise<ProblemLog[]> {
    return db.select().from(problemLogs)
      .where(eq(problemLogs.userId, userId))
      .orderBy(desc(problemLogs.date))
      .limit(limit);
  }

  async getNotes(userId: string): Promise<Note[]> {
    return db.select().from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.date))
      .limit(100);
  }

  async createNote(userId: string, data: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes)
      .values({ ...data, userId })
      .returning();
    return note;
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    await db.delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  }

  async getNotesByUser(userId: string, limit = 30): Promise<Note[]> {
    return db.select().from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.date))
      .limit(limit);
  }

  async adminDeleteNote(noteId: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, noteId));
  }

  async adminDeletePrayerLog(logId: string): Promise<void> {
    await db.delete(prayerLogs).where(eq(prayerLogs.id, logId));
  }

  async adminDeleteProblemLog(logId: string): Promise<void> {
    await db.delete(problemLogs).where(eq(problemLogs.id, logId));
  }

  async getDailyTarget(userId: string, date: string): Promise<DailyTarget | undefined> {
    const [target] = await db.select().from(dailyTargets)
      .where(and(eq(dailyTargets.userId, userId), eq(dailyTargets.date, date)));
    return target;
  }

  async upsertDailyTarget(userId: string, data: InsertDailyTarget): Promise<DailyTarget> {
    const existing = await this.getDailyTarget(userId, data.date);
    if (existing) {
      const [updated] = await db.update(dailyTargets)
        .set({
          prayersTarget: data.prayersTarget,
          problemsTarget: data.problemsTarget,
          notesTarget: data.notesTarget,
          customJson: data.customJson,
        })
        .where(eq(dailyTargets.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(dailyTargets)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async getWeeklyTarget(userId: string, weekStart: string): Promise<WeeklyTarget | undefined> {
    const [target] = await db.select().from(weeklyTargets)
      .where(and(eq(weeklyTargets.userId, userId), eq(weeklyTargets.weekStart, weekStart)));
    return target;
  }

  async upsertWeeklyTarget(userId: string, data: InsertWeeklyTarget): Promise<WeeklyTarget> {
    const existing = await this.getWeeklyTarget(userId, data.weekStart);
    if (existing) {
      const [updated] = await db.update(weeklyTargets)
        .set({
          weeklyProblemsTarget: data.weeklyProblemsTarget,
          weeklyConsistencyTargetPercent: data.weeklyConsistencyTargetPercent,
          customJson: data.customJson,
        })
        .where(eq(weeklyTargets.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(weeklyTargets)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async getDailyTargetsByUser(userId: string, limit = 10): Promise<DailyTarget[]> {
    return db.select().from(dailyTargets)
      .where(eq(dailyTargets.userId, userId))
      .orderBy(desc(dailyTargets.date))
      .limit(limit);
  }

  async getWeeklyTargetsByUser(userId: string, limit = 10): Promise<WeeklyTarget[]> {
    return db.select().from(weeklyTargets)
      .where(eq(weeklyTargets.userId, userId))
      .orderBy(desc(weeklyTargets.weekStart))
      .limit(limit);
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async getEventsCount(eventName: string | null, since: Date): Promise<number> {
    const conditions = [gte(events.createdAt, since)];
    if (eventName) {
      conditions.push(eq(events.eventName, eventName));
    }
    const [result] = await db.select({ count: count() }).from(events).where(and(...conditions));
    return result.count;
  }

  async getActiveUsersCount(since: Date): Promise<number> {
    const result = await db.selectDistinct({ userId: events.userId })
      .from(events)
      .where(and(
        gte(events.createdAt, since),
        sql`${events.userId} IS NOT NULL`,
      ));
    return result.length;
  }

  async getNewSignupsCount(since: Date): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, since));
    return result.count;
  }

  async getRetainedUsersCount(since: Date, minDays: number): Promise<number> {
    const result = await db
      .select({
        userId: events.userId,
        activeDays: sql<number>`COUNT(DISTINCT DATE(${events.createdAt}))`,
      })
      .from(events)
      .where(and(
        gte(events.createdAt, since),
        sql`${events.userId} IS NOT NULL`,
      ))
      .groupBy(events.userId)
      .having(sql`COUNT(DISTINCT DATE(${events.createdAt})) >= ${minDays}`);
    return result.length;
  }

  async getTopPages(since: Date, limit: number): Promise<{ path: string; count: number }[]> {
    const result = await db
      .select({
        path: events.path,
        count: count(),
      })
      .from(events)
      .where(and(
        gte(events.createdAt, since),
        eq(events.eventName, "page_view"),
        sql`${events.path} IS NOT NULL`,
      ))
      .groupBy(events.path)
      .orderBy(desc(count()))
      .limit(limit);
    return result.map((r) => ({ path: r.path!, count: r.count }));
  }

  async getEventsTrend(eventName: string, days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const result = await db
      .select({
        date: sql<string>`DATE(${events.createdAt})`,
        count: count(),
      })
      .from(events)
      .where(and(
        gte(events.createdAt, since),
        eq(events.eventName, eventName),
      ))
      .groupBy(sql`DATE(${events.createdAt})`)
      .orderBy(asc(sql`DATE(${events.createdAt})`));
    return result.map((r) => ({ date: r.date, count: r.count }));
  }

  async getOverviewStats(): Promise<any> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [prayerCount] = await db.select({ count: count() }).from(prayerLogs);
    const [problemCount] = await db.select({ count: count() }).from(problemLogs);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const activePrayerUsers = await db.selectDistinct({ userId: prayerLogs.userId })
      .from(prayerLogs)
      .where(gte(prayerLogs.date, dateStr));

    const activeProblemUsers = await db.selectDistinct({ userId: problemLogs.userId })
      .from(problemLogs)
      .where(gte(problemLogs.date, dateStr));

    const activeUserIds = new Set([
      ...activePrayerUsers.map((u) => u.userId),
      ...activeProblemUsers.map((u) => u.userId),
    ]);

    const newSignups = await this.getNewSignupsCount(sevenDaysAgo);

    return {
      totalUsers: userCount.count,
      activeUsers: activeUserIds.size,
      totalPrayerLogs: prayerCount.count,
      totalProblemLogs: problemCount.count,
      newSignups7d: newSignups,
    };
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getTotalPrayerLogs(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(prayerLogs);
    return result.count;
  }

  async getTotalProblemLogs(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(problemLogs);
    return result.count;
  }
}

export const storage = new DatabaseStorage();
