import { aiConfig } from "./config";
import type { AIProvider as AIProviderInterface } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { CustomHTTPProvider } from "./providers/custom_http";
import { storage } from "../storage";
import { format, subDays } from "date-fns";

function getProvider(): AIProviderInterface {
  switch (aiConfig.provider) {
    case "openai":
      return new OpenAIProvider();
    case "custom_http":
      return new CustomHTTPProvider();
    default:
      return new OpenAIProvider();
  }
}

async function getUserContext(userId: string): Promise<string> {
  const today = format(new Date(), "yyyy-MM-dd");
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));

  const prayerLogs = await storage.getPrayerLogsForStreak(userId);
  const problemLogs = await storage.getProblemLogsForStreak(userId);
  const notes = await storage.getNotes(userId);

  const weeklyPrayerComplete = prayerLogs.filter(
    (l) => last7Days.includes(l.date) && l.fajr && l.dhuhr && l.asr && l.maghrib && l.isha
  ).length;

  const weeklyProblems = problemLogs
    .filter((l) => last7Days.includes(l.date))
    .reduce((sum, l) => sum + l.solvedCount, 0);

  const weeklyNotes = notes.filter((n) => last7Days.includes(n.date)).length;

  let financeContext = "";
  try {
    const summary = await storage.getFinanceSummary(userId);
    const currentBalance = summary.startingBalance + summary.totalIncome - summary.totalExpense;
    financeContext = `Finance: Current balance ${currentBalance}, this month income: ${summary.totalIncome}, expenses: ${summary.totalExpense}.`;
  } catch {}

  return `User's last 7 days: ${weeklyPrayerComplete}/7 days all prayers done, ${weeklyProblems} problems solved, ${weeklyNotes} notes written. ${financeContext}`;
}

export async function getAIResponse(message: string, userId: string, language?: string): Promise<string> {
  if (!aiConfig.enabled) {
    return "AI Coach is disabled. Enable it by setting AI_ENABLED=true.";
  }

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return `AI Coach provider (${aiConfig.provider}) is not configured. Set the required API keys. To switch AI provider, edit server/ai/config.ts`;
  }

  const userContext = await getUserContext(userId);

  const langInstruction = language === "bn"
    ? "IMPORTANT: The user's language preference is Bangla (বাংলা). You MUST respond primarily in Bangla. You may use some English technical terms where appropriate, but the main language of your response should be Bangla."
    : "IMPORTANT: The user's language preference is English. You MUST respond primarily in English. You may use some Bangla words where culturally appropriate (like prayer names).";

  const systemPrompt = `You are Niyyah AI Coach - a personal growth assistant that helps users track prayers, problem-solving, notes, targets, and finances. Analyze the user's data and tell them if they're ahead, on track, or behind. Give specific reasons and actionable next steps. For finance, suggest daily spending limits. Never hallucinate - if data is missing, ask questions. Be encouraging but honest.

${langInstruction}

Current user data:
${userContext}`;

  const response = await provider.chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ]);

  return response;
}
