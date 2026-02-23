import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, prayerLogs, problemLogs, notes, dailyTargets, weeklyTargets,
  type User, type InsertUser, type PrayerLog, type InsertPrayerLog,
  type ProblemLog, type InsertProblemLog, type Note, type InsertNote,
  type DailyTarget, type InsertDailyTarget, type WeeklyTarget, type InsertWeeklyTarget,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string }): Promise<User>;
  updateUsername(userId: string, username: string): Promise<User>;
  updatePassword(userId: string, password: string): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  getPrayerLog(userId: string, date: string): Promise<PrayerLog | undefined>;
  upsertPrayerLog(userId: string, data: InsertPrayerLog): Promise<PrayerLog>;
  getPrayerLogsByMonth(userId: string, yearMonth: string): Promise<PrayerLog[]>;
  getPrayerLogsForStreak(userId: string): Promise<PrayerLog[]>;

  getProblemLog(userId: string, date: string): Promise<ProblemLog | undefined>;
  upsertProblemLog(userId: string, data: InsertProblemLog): Promise<ProblemLog>;
  getProblemLogsForStreak(userId: string): Promise<ProblemLog[]>;
  getProblemLogsForChart(userId: string, days: number): Promise<ProblemLog[]>;

  getNotes(userId: string): Promise<Note[]>;
  createNote(userId: string, data: InsertNote): Promise<Note>;
  deleteNote(userId: string, noteId: string): Promise<void>;

  getDailyTarget(userId: string, date: string): Promise<DailyTarget | undefined>;
  upsertDailyTarget(userId: string, data: InsertDailyTarget): Promise<DailyTarget>;
  getWeeklyTarget(userId: string, weekStart: string): Promise<WeeklyTarget | undefined>;
  upsertWeeklyTarget(userId: string, data: InsertWeeklyTarget): Promise<WeeklyTarget>;

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

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
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

    return {
      totalUsers: userCount.count,
      activeUsers: activeUserIds.size,
      totalPrayerLogs: prayerCount.count,
      totalProblemLogs: problemCount.count,
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
