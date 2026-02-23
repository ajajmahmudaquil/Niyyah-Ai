import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsistencyBadge, ConsistencyBar } from "@/components/consistency-badge";
import { Compass, Code2, StickyNote, Flame, TrendingUp, Calendar } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const consistencyScore = stats?.consistencyScore ?? 0;

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div className="islamic-pattern-bg rounded-xl p-5 -mx-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back, {user?.username || "there"}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground text-sm">Here's your weekly overview</p>
            <ConsistencyBadge score={consistencyScore} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium">Weekly Consistency</span>
            <span className="text-sm text-muted-foreground">{Math.round(consistencyScore)}%</span>
          </div>
          <ConsistencyBar score={consistencyScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prayer Streak</CardTitle>
            <Flame className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-prayer-streak">
              {stats?.prayerStreak ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {stats?.longestPrayerStreak ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problem Streak</CardTitle>
            <Code2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-problem-streak">
              {stats?.problemStreak ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {stats?.longestProblemStreak ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Prayers</CardTitle>
            <Compass className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-prayers">
              {stats?.todayPrayers ?? 0}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly: {stats?.weeklyPrayerPercent ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problems This Week</CardTitle>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-weekly-problems">
              {stats?.weeklyProblems ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Today: {stats?.todayProblems ?? 0} solved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes Today</CardTitle>
            <StickyNote className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-notes">
              {stats?.todayNotes ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This week: {stats?.weeklyNotes ?? 0} notes
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Since</CardTitle>
            <Calendar className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-member-since">
              {stats?.daysSinceJoined ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">days on Niyyah</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
