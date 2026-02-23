import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, jsonb, timestamp, uniqueIndex, index, numeric, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull().default(""),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  emailVerified: boolean("email_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  currency: text("currency").notNull().default("BDT"),
  timezone: text("timezone").notNull().default("Asia/Dhaka"),
  bio: text("bio"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  sessionId: text("session_id"),
  eventName: text("event_name").notNull(),
  path: text("path"),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("events_created_at_idx").on(table.createdAt),
  index("events_user_id_idx").on(table.userId),
  index("events_event_name_idx").on(table.eventName),
]);

export const prayerLogs = pgTable("prayer_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  fajr: boolean("fajr").notNull().default(false),
  dhuhr: boolean("dhuhr").notNull().default(false),
  asr: boolean("asr").notNull().default(false),
  maghrib: boolean("maghrib").notNull().default(false),
  isha: boolean("isha").notNull().default(false),
  note: text("note"),
}, (table) => [
  uniqueIndex("prayer_logs_user_date_idx").on(table.userId, table.date),
]);

export const problemLogs = pgTable("problem_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  solvedCount: integer("solved_count").notNull().default(0),
  platform: text("platform"),
  links: text("links").array(),
  tags: text("tags").array(),
  note: text("note"),
}, (table) => [
  uniqueIndex("problem_logs_user_date_idx").on(table.userId, table.date),
]);

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
});

export const targets = pgTable("targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("daily"),
  title: text("title").notNull(),
  unit: text("unit"),
  targetValue: integer("target_value").notNull().default(1),
  active: boolean("active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const targetLogsDaily = pgTable("target_logs_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull().references(() => targets.id),
  date: date("date").notNull(),
  actualValue: integer("actual_value").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
}, (table) => [
  uniqueIndex("target_logs_daily_user_target_date_idx").on(table.userId, table.targetId, table.date),
]);

export const targetLogsWeekly = pgTable("target_logs_weekly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull().references(() => targets.id),
  weekStart: date("week_start").notNull(),
  actualValue: integer("actual_value").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
}, (table) => [
  uniqueIndex("target_logs_weekly_user_target_week_idx").on(table.userId, table.targetId, table.weekStart),
]);

export const financeSettings = pgTable("finance_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  startingBalance: numeric("starting_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const incomeLogs = pgTable("income_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  source: text("source"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenseLogs = pgTable("expense_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Keep legacy tables for migration compatibility
export const dailyTargets = pgTable("targets_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  prayersTarget: integer("prayers_target").notNull().default(5),
  problemsTarget: integer("problems_target").notNull().default(3),
  notesTarget: integer("notes_target").notNull().default(1),
  customJson: jsonb("custom_json"),
}, (table) => [
  uniqueIndex("targets_daily_user_date_idx").on(table.userId, table.date),
]);

export const weeklyTargets = pgTable("targets_weekly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekStart: date("week_start").notNull(),
  weeklyProblemsTarget: integer("weekly_problems_target").notNull().default(15),
  weeklyConsistencyTargetPercent: integer("weekly_consistency_target_percent").notNull().default(75),
  customJson: jsonb("custom_json"),
}, (table) => [
  uniqueIndex("targets_weekly_user_week_idx").on(table.userId, table.weekStart),
]);

const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine((pw) => /[A-Z]/.test(pw), "Must contain at least 1 uppercase letter")
  .refine((pw) => /[a-z]/.test(pw), "Must contain at least 1 lowercase letter")
  .refine((pw) => /[0-9]/.test(pw), "Must contain at least 1 number")
  .refine((pw) => /[^A-Za-z0-9]/.test(pw), "Must contain at least 1 special character");

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: strongPasswordSchema,
  fullName: z.string().min(1, "Full name is required").max(100, "Full name too long"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const usernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const insertPrayerLogSchema = createInsertSchema(prayerLogs).omit({
  id: true,
  userId: true,
});

export const insertProblemLogSchema = createInsertSchema(problemLogs).omit({
  id: true,
  userId: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  userId: true,
});

export const insertTargetSchema = createInsertSchema(targets).omit({
  id: true,
  userId: true,
  createdAt: true,
  isDefault: true,
});

export const insertTargetLogDailySchema = createInsertSchema(targetLogsDaily).omit({
  id: true,
  userId: true,
});

export const insertTargetLogWeeklySchema = createInsertSchema(targetLogsWeekly).omit({
  id: true,
  userId: true,
});

export const insertFinanceSettingsSchema = createInsertSchema(financeSettings).omit({
  userId: true,
  updatedAt: true,
});

export const insertIncomeLogSchema = createInsertSchema(incomeLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertExpenseLogSchema = createInsertSchema(expenseLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDailyTargetSchema = createInsertSchema(dailyTargets).omit({
  id: true,
  userId: true,
});

export const insertWeeklyTargetSchema = createInsertSchema(weeklyTargets).omit({
  id: true,
  userId: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
  language: z.enum(["en", "bn"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PrayerLog = typeof prayerLogs.$inferSelect;
export type InsertPrayerLog = z.infer<typeof insertPrayerLogSchema>;
export type ProblemLog = typeof problemLogs.$inferSelect;
export type InsertProblemLog = z.infer<typeof insertProblemLogSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type TargetDef = typeof targets.$inferSelect;
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type TargetLogDaily = typeof targetLogsDaily.$inferSelect;
export type InsertTargetLogDaily = z.infer<typeof insertTargetLogDailySchema>;
export type TargetLogWeekly = typeof targetLogsWeekly.$inferSelect;
export type InsertTargetLogWeekly = z.infer<typeof insertTargetLogWeeklySchema>;
export type FinanceSettings = typeof financeSettings.$inferSelect;
export type InsertFinanceSettings = z.infer<typeof insertFinanceSettingsSchema>;
export type IncomeLog = typeof incomeLogs.$inferSelect;
export type InsertIncomeLog = z.infer<typeof insertIncomeLogSchema>;
export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type InsertExpenseLog = z.infer<typeof insertExpenseLogSchema>;
export type DailyTarget = typeof dailyTargets.$inferSelect;
export type InsertDailyTarget = z.infer<typeof insertDailyTargetSchema>;
export type WeeklyTarget = typeof weeklyTargets.$inferSelect;
export type InsertWeeklyTarget = z.infer<typeof insertWeeklyTargetSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
