import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
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

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PrayerLog = typeof prayerLogs.$inferSelect;
export type InsertPrayerLog = z.infer<typeof insertPrayerLogSchema>;
export type ProblemLog = typeof problemLogs.$inferSelect;
export type InsertProblemLog = z.infer<typeof insertProblemLogSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type DailyTarget = typeof dailyTargets.$inferSelect;
export type InsertDailyTarget = z.infer<typeof insertDailyTargetSchema>;
export type WeeklyTarget = typeof weeklyTargets.$inferSelect;
export type InsertWeeklyTarget = z.infer<typeof insertWeeklyTargetSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
