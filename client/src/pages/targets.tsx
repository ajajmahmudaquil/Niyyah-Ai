import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Target, Save } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import type { DailyTarget, WeeklyTarget } from "@shared/schema";

export default function TargetsPage() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: dailyTarget, isLoading: loadingDaily } = useQuery<DailyTarget | null>({
    queryKey: ["/api/targets/daily", today],
  });

  const { data: weeklyTarget, isLoading: loadingWeekly } = useQuery<WeeklyTarget | null>({
    queryKey: ["/api/targets/weekly", weekStart],
  });

  const [prayersTarget, setPrayersTarget] = useState<number | undefined>();
  const [problemsTarget, setProblemsTarget] = useState<number | undefined>();
  const [notesTarget, setNotesTarget] = useState<number | undefined>();
  const [weeklyProblemsTarget, setWeeklyProblemsTarget] = useState<number | undefined>();
  const [weeklyConsistencyTarget, setWeeklyConsistencyTarget] = useState<number | undefined>();

  const saveDailyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/targets/daily", {
        date: today,
        prayersTarget: prayersTarget ?? dailyTarget?.prayersTarget ?? 5,
        problemsTarget: problemsTarget ?? dailyTarget?.problemsTarget ?? 3,
        notesTarget: notesTarget ?? dailyTarget?.notesTarget ?? 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets/daily"] });
      toast({ title: "Daily targets saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const saveWeeklyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/targets/weekly", {
        weekStart,
        weeklyProblemsTarget: weeklyProblemsTarget ?? weeklyTarget?.weeklyProblemsTarget ?? 15,
        weeklyConsistencyTargetPercent: weeklyConsistencyTarget ?? weeklyTarget?.weeklyConsistencyTargetPercent ?? 75,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets/weekly"] });
      toast({ title: "Weekly targets saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Targets</h1>
        <p className="text-muted-foreground text-sm">Set your daily and weekly goals</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily" data-testid="tab-daily-targets">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly-targets">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Daily Targets - {format(new Date(), "MMM d")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDaily ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Prayers Target (out of 5)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={prayersTarget ?? dailyTarget?.prayersTarget ?? 5}
                      onChange={(e) => setPrayersTarget(parseInt(e.target.value) || 0)}
                      data-testid="input-prayers-target"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Problems Target</Label>
                    <Input
                      type="number"
                      min={0}
                      value={problemsTarget ?? dailyTarget?.problemsTarget ?? 3}
                      onChange={(e) => setProblemsTarget(parseInt(e.target.value) || 0)}
                      data-testid="input-problems-target"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes Target</Label>
                    <Input
                      type="number"
                      min={0}
                      value={notesTarget ?? dailyTarget?.notesTarget ?? 1}
                      onChange={(e) => setNotesTarget(parseInt(e.target.value) || 0)}
                      data-testid="input-notes-target"
                    />
                  </div>
                  <Button
                    onClick={() => saveDailyMutation.mutate()}
                    className="w-full"
                    disabled={saveDailyMutation.isPending}
                    data-testid="button-save-daily-targets"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Daily Targets
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Weekly Targets - Week of {format(new Date(weekStart), "MMM d")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingWeekly ? (
                [1, 2].map((i) => <Skeleton key={i} className="h-10" />)
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Weekly Problems Target</Label>
                    <Input
                      type="number"
                      min={0}
                      value={weeklyProblemsTarget ?? weeklyTarget?.weeklyProblemsTarget ?? 15}
                      onChange={(e) => setWeeklyProblemsTarget(parseInt(e.target.value) || 0)}
                      data-testid="input-weekly-problems-target"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Consistency Target (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={weeklyConsistencyTarget ?? weeklyTarget?.weeklyConsistencyTargetPercent ?? 75}
                      onChange={(e) => setWeeklyConsistencyTarget(parseInt(e.target.value) || 0)}
                      data-testid="input-weekly-consistency-target"
                    />
                  </div>
                  <Button
                    onClick={() => saveWeeklyMutation.mutate()}
                    className="w-full"
                    disabled={saveWeeklyMutation.isPending}
                    data-testid="button-save-weekly-targets"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Weekly Targets
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
