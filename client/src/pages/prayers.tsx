import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import type { PrayerLog } from "@shared/schema";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export default function PrayersPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: todayLog, isLoading } = useQuery<PrayerLog | null>({
    queryKey: ["/api/prayers", dateStr],
  });

  const { data: streakData } = useQuery<any>({
    queryKey: ["/api/prayers/streak"],
  });

  const { data: monthLogs } = useQuery<PrayerLog[]>({
    queryKey: ["/api/prayers/month", format(calendarMonth, "yyyy-MM")],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/prayers", { ...data, date: dateStr });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/month"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Prayer log saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const [note, setNote] = useState("");
  const prayers: Record<string, boolean> = {
    fajr: todayLog?.fajr ?? false,
    dhuhr: todayLog?.dhuhr ?? false,
    asr: todayLog?.asr ?? false,
    maghrib: todayLog?.maghrib ?? false,
    isha: todayLog?.isha ?? false,
  };

  const togglePrayer = (prayer: string) => {
    const updated = { ...prayers, [prayer]: !prayers[prayer] };
    saveMutation.mutate({ ...updated, note: todayLog?.note || note });
  };

  const completedCount = Object.values(prayers).filter(Boolean).length;
  const isComplete = completedCount === 5;

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Prayer Tracker</h1>
          <p className="text-muted-foreground text-sm">Track your 5 daily prayers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-500">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-semibold" data-testid="text-prayer-streak">
              {streakData?.currentStreak ?? 0} day streak
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[140px] text-center">
          {format(selectedDate, "EEEE, MMM d, yyyy")}
        </span>
        <Button size="icon" variant="ghost" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-1">
              <CardTitle className="text-base">Today's Prayers</CardTitle>
              <Badge variant={isComplete ? "default" : "secondary"}>
                {completedCount}/5
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              PRAYERS.map((p) => <Skeleton key={p} className="h-10" />)
            ) : (
              PRAYERS.map((prayer) => (
                <div
                  key={prayer}
                  className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                  data-testid={`prayer-${prayer}`}
                >
                  <Checkbox
                    checked={prayers[prayer]}
                    onCheckedChange={() => togglePrayer(prayer)}
                    data-testid={`checkbox-${prayer}`}
                  />
                  <span className="font-medium text-sm">{PRAYER_LABELS[prayer]}</span>
                </div>
              ))
            )}
            <Textarea
              placeholder="Add a note for today..."
              value={todayLog?.note || note}
              onChange={(e) => {
                setNote(e.target.value);
              }}
              onBlur={() => {
                if (note !== (todayLog?.note || "")) {
                  saveMutation.mutate({ ...prayers, note });
                }
              }}
              className="mt-3"
              data-testid="textarea-prayer-note"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Streak Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold" data-testid="text-current-streak">
                    {streakData?.currentStreak ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-longest-streak">
                    {streakData?.longestStreak ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Longest Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{streakData?.weeklyPercent ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Weekly Completion</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{streakData?.totalDays ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Days Logged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-base">
                  {format(calendarMonth, "MMMM yyyy")}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCalendarMonth(subDays(startOfMonth(calendarMonth), 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCalendarMonth(addDays(endOfMonth(calendarMonth), 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground font-medium p-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const log = monthLogs?.find((l) => l.date === dayStr);
                  const allComplete = log && log.fajr && log.dhuhr && log.asr && log.maghrib && log.isha;
                  const someComplete = log && (log.fajr || log.dhuhr || log.asr || log.maghrib || log.isha);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <button
                      key={dayStr}
                      onClick={() => setSelectedDate(day)}
                      className={`p-1 text-xs rounded-md text-center transition-colors
                        ${isSelected ? "ring-2 ring-primary" : ""}
                        ${allComplete ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
                          someComplete ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                          "text-muted-foreground"}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
