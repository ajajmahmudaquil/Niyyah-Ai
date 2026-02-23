import { eq, and, desc, sql, gte, lte, count, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users, prayerLogs, problemLogs, notes, dailyTargets, weeklyTargets,
  passwordResetTokens, events, emailVerificationTokens,
  targets, targetLogsDaily, targetLogsWeekly,
  financeSettings, incomeLogs, expenseLogs,
  type User, type InsertUser, type PrayerLog, type InsertPrayerLog,
  type ProblemLog, type InsertProblemLog, type Note, type InsertNote,
  type DailyTarget, type InsertDailyTarget, type WeeklyTarget, type InsertWeeklyTarget,
  type Event, type InsertEvent, type PasswordResetToken, type EmailVerificationToken,
  type TargetDef, type InsertTarget, type TargetLogDaily, type TargetLogWeekly,
  type FinanceSettings, type IncomeLog, type InsertIncomeLog,
  type ExpenseLog, type InsertExpenseLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; fullName: string }): Promise<User>;
  updateUsername(userId: string, username: string): Promise<User>;
  updatePassword(userId: string, password: string): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<void>;
  updateUserStatus(userId: string, status: string): Promise<void>;
  updateProfile(userId: string, data: { fullName?: string; bio?: string | null; currency?: string; timezone?: string }): Promise<User>;
  updateAvatarUrl(userId: string, url: string | null): Promise<void>;
  setEmailVerified(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenUsed(tokenId: string): Promise<void>;

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

  getTargets(userId: string): Promise<TargetDef[]>;
  getTargetsByType(userId: string, type: string): Promise<TargetDef[]>;
  createTarget(userId: string, data: InsertTarget): Promise<TargetDef>;
  updateTarget(userId: string, targetId: string, data: Partial<InsertTarget>): Promise<TargetDef>;
  deleteTarget(userId: string, targetId: string): Promise<void>;
  createDefaultTargets(userId: string): Promise<void>;
  upsertTargetLogDaily(userId: string, targetId: string, date: string, actualValue: number): Promise<TargetLogDaily>;
  getTargetLogsDaily(userId: string, date: string): Promise<TargetLogDaily[]>;
  upsertTargetLogWeekly(userId: string, targetId: string, weekStart: string, actualValue: number): Promise<TargetLogWeekly>;
  getTargetLogsWeekly(userId: string, weekStart: string): Promise<TargetLogWeekly[]>;

  getFinanceSettings(userId: string): Promise<FinanceSettings | undefined>;
  upsertFinanceSettings(userId: string, startingBalance: string): Promise<FinanceSettings>;
  getIncomeLogs(userId: string, limit?: number): Promise<IncomeLog[]>;
  getIncomeLogsByMonth(userId: string, yearMonth: string): Promise<IncomeLog[]>;
  createIncomeLog(userId: string, data: InsertIncomeLog): Promise<IncomeLog>;
  deleteIncomeLog(userId: string, logId: string): Promise<void>;
  getExpenseLogs(userId: string, limit?: number): Promise<ExpenseLog[]>;
  getExpenseLogsByMonth(userId: string, yearMonth: string): Promise<ExpenseLog[]>;
  createExpenseLog(userId: string, data: InsertExpenseLog): Promise<ExpenseLog>;
  deleteExpenseLog(userId: string, logId: string): Promise<void>;
  getFinanceSummary(userId: string): Promise<{ totalIncome: number; totalExpense: number; startingBalance: number }>;
  getMonthlyFinanceData(userId: string, months: number): Promise<{ month: string; income: number; expense: number }[]>;

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

  async createUser(data: { email: string; password: string; fullName: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      password: data.password,
      fullName: data.fullName,
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

  async updateProfile(userId: string, data: { fullName?: string; bio?: string | null; currency?: string; timezone?: string }): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return user;
  }

  async updateAvatarUrl(userId: string, url: string | null): Promise<void> {
    await db.update(users).set({ avatarUrl: url }).where(eq(users.id, userId));
  }

  async setEmailVerified(userId: string): Promise<void> {
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const [record] = await db.insert(emailVerificationTokens).values({ userId, token, expiresAt }).returning();
    return record;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [record] = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    return record;
  }

  async markEmailVerificationTokenUsed(tokenId: string): Promise<void> {
    await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, tokenId));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [record] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
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
    const [year, month] = yearMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
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

  async getTargets(userId: string): Promise<TargetDef[]> {
    return db.select().from(targets)
      .where(eq(targets.userId, userId))
      .orderBy(desc(targets.isDefault), asc(targets.createdAt));
  }

  async getTargetsByType(userId: string, type: string): Promise<TargetDef[]> {
    return db.select().from(targets)
      .where(and(eq(targets.userId, userId), eq(targets.type, type)))
      .orderBy(desc(targets.isDefault), asc(targets.createdAt));
  }

  async createTarget(userId: string, data: InsertTarget): Promise<TargetDef> {
    const [target] = await db.insert(targets)
      .values({ ...data, userId })
      .returning();
    return target;
  }

  async updateTarget(userId: string, targetId: string, data: Partial<InsertTarget>): Promise<TargetDef> {
    const [target] = await db.update(targets)
      .set(data)
      .where(and(eq(targets.id, targetId), eq(targets.userId, userId)))
      .returning();
    return target;
  }

  async deleteTarget(userId: string, targetId: string): Promise<void> {
    await db.delete(targetLogsDaily).where(and(eq(targetLogsDaily.targetId, targetId), eq(targetLogsDaily.userId, userId)));
    await db.delete(targetLogsWeekly).where(and(eq(targetLogsWeekly.targetId, targetId), eq(targetLogsWeekly.userId, userId)));
    await db.delete(targets).where(and(eq(targets.id, targetId), eq(targets.userId, userId)));
  }

  async createDefaultTargets(userId: string): Promise<void> {
    const existing = await this.getTargets(userId);
    if (existing.length > 0) return;

    await db.insert(targets).values([
      { userId, type: "daily", title: "Prayers", unit: "out of 5", targetValue: 5, isDefault: true },
      { userId, type: "daily", title: "Problems Solved", unit: "problems", targetValue: 3, isDefault: true },
      { userId, type: "daily", title: "Notes Written", unit: "notes", targetValue: 1, isDefault: true },
    ]);
  }

  async upsertTargetLogDaily(userId: string, targetId: string, date: string, actualValue: number): Promise<TargetLogDaily> {
    const target = await db.select().from(targets).where(eq(targets.id, targetId));
    const completed = target[0] ? actualValue >= target[0].targetValue : false;

    const existing = await db.select().from(targetLogsDaily)
      .where(and(eq(targetLogsDaily.userId, userId), eq(targetLogsDaily.targetId, targetId), eq(targetLogsDaily.date, date)));

    if (existing[0]) {
      const [updated] = await db.update(targetLogsDaily)
        .set({ actualValue, completed })
        .where(eq(targetLogsDaily.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(targetLogsDaily)
      .values({ userId, targetId, date, actualValue, completed })
      .returning();
    return created;
  }

  async getTargetLogsDaily(userId: string, date: string): Promise<TargetLogDaily[]> {
    return db.select().from(targetLogsDaily)
      .where(and(eq(targetLogsDaily.userId, userId), eq(targetLogsDaily.date, date)));
  }

  async upsertTargetLogWeekly(userId: string, targetId: string, weekStart: string, actualValue: number): Promise<TargetLogWeekly> {
    const target = await db.select().from(targets).where(eq(targets.id, targetId));
    const completed = target[0] ? actualValue >= target[0].targetValue : false;

    const existing = await db.select().from(targetLogsWeekly)
      .where(and(eq(targetLogsWeekly.userId, userId), eq(targetLogsWeekly.targetId, targetId), eq(targetLogsWeekly.weekStart, weekStart)));

    if (existing[0]) {
      const [updated] = await db.update(targetLogsWeekly)
        .set({ actualValue, completed })
        .where(eq(targetLogsWeekly.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(targetLogsWeekly)
      .values({ userId, targetId, weekStart, actualValue, completed })
      .returning();
    return created;
  }

  async getTargetLogsWeekly(userId: string, weekStart: string): Promise<TargetLogWeekly[]> {
    return db.select().from(targetLogsWeekly)
      .where(and(eq(targetLogsWeekly.userId, userId), eq(targetLogsWeekly.weekStart, weekStart)));
  }

  async getFinanceSettings(userId: string): Promise<FinanceSettings | undefined> {
    const [settings] = await db.select().from(financeSettings)
      .where(eq(financeSettings.userId, userId));
    return settings;
  }

  async upsertFinanceSettings(userId: string, startingBalance: string): Promise<FinanceSettings> {
    const existing = await this.getFinanceSettings(userId);
    if (existing) {
      const [updated] = await db.update(financeSettings)
        .set({ startingBalance, updatedAt: new Date() })
        .where(eq(financeSettings.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(financeSettings)
      .values({ userId, startingBalance })
      .returning();
    return created;
  }

  async getIncomeLogs(userId: string, limit = 50): Promise<IncomeLog[]> {
    return db.select().from(incomeLogs)
      .where(eq(incomeLogs.userId, userId))
      .orderBy(desc(incomeLogs.date))
      .limit(limit);
  }

  async getIncomeLogsByMonth(userId: string, yearMonth: string): Promise<IncomeLog[]> {
    const startDate = `${yearMonth}-01`;
    const [year, month] = yearMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
    return db.select().from(incomeLogs)
      .where(and(eq(incomeLogs.userId, userId), gte(incomeLogs.date, startDate), lte(incomeLogs.date, endDate)))
      .orderBy(desc(incomeLogs.date));
  }

  async createIncomeLog(userId: string, data: InsertIncomeLog): Promise<IncomeLog> {
    const [log] = await db.insert(incomeLogs).values({ ...data, userId }).returning();
    return log;
  }

  async deleteIncomeLog(userId: string, logId: string): Promise<void> {
    await db.delete(incomeLogs).where(and(eq(incomeLogs.id, logId), eq(incomeLogs.userId, userId)));
  }

  async getExpenseLogs(userId: string, limit = 50): Promise<ExpenseLog[]> {
    return db.select().from(expenseLogs)
      .where(eq(expenseLogs.userId, userId))
      .orderBy(desc(expenseLogs.date))
      .limit(limit);
  }

  async getExpenseLogsByMonth(userId: string, yearMonth: string): Promise<ExpenseLog[]> {
    const startDate = `${yearMonth}-01`;
    const [year, month] = yearMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
    return db.select().from(expenseLogs)
      .where(and(eq(expenseLogs.userId, userId), gte(expenseLogs.date, startDate), lte(expenseLogs.date, endDate)))
      .orderBy(desc(expenseLogs.date));
  }

  async createExpenseLog(userId: string, data: InsertExpenseLog): Promise<ExpenseLog> {
    const [log] = await db.insert(expenseLogs).values({ ...data, userId }).returning();
    return log;
  }

  async deleteExpenseLog(userId: string, logId: string): Promise<void> {
    await db.delete(expenseLogs).where(and(eq(expenseLogs.id, logId), eq(expenseLogs.userId, userId)));
  }

  async getFinanceSummary(userId: string): Promise<{ totalIncome: number; totalExpense: number; startingBalance: number }> {
    const settings = await this.getFinanceSettings(userId);
    const startingBalance = settings ? parseFloat(settings.startingBalance) : 0;

    const [incomeResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${incomeLogs.amount}::numeric), 0)`,
    }).from(incomeLogs).where(eq(incomeLogs.userId, userId));

    const [expenseResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${expenseLogs.amount}::numeric), 0)`,
    }).from(expenseLogs).where(eq(expenseLogs.userId, userId));

    return {
      totalIncome: parseFloat(incomeResult.total),
      totalExpense: parseFloat(expenseResult.total),
      startingBalance,
    };
  }

  async getMonthlyFinanceData(userId: string, months: number): Promise<{ month: string; income: number; expense: number }[]> {
    const result: { month: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthIncome = await this.getIncomeLogsByMonth(userId, yearMonth);
      const monthExpense = await this.getExpenseLogsByMonth(userId, yearMonth);

      result.push({
        month: yearMonth,
        income: monthIncome.reduce((sum, l) => sum + parseFloat(l.amount), 0),
        expense: monthExpense.reduce((sum, l) => sum + parseFloat(l.amount), 0),
      });
    }

    return result;
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
