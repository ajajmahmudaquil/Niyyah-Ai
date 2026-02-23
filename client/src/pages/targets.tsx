import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Trash2, Check, Loader2, Save } from "lucide-react";
import { format, startOfWeek } from "date-fns";

interface TargetDef {
  id: string;
  userId: string;
  title: string;
  type: "daily" | "weekly";
  unit: string | null;
  targetValue: number;
  active: boolean;
  createdAt: string;
}

interface TargetLogDaily {
  id: string;
  userId: string;
  targetId: string;
  date: string;
  actualValue: number;
  completed: boolean;
  createdAt: string;
}

interface TargetLogWeekly {
  id: string;
  userId: string;
  targetId: string;
  weekStart: string;
  actualValue: number;
  completed: boolean;
  createdAt: string;
}

export default function TargetsPage() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"daily" | "weekly">("daily");
  const [newUnit, setNewUnit] = useState("");
  const [newTargetValue, setNewTargetValue] = useState("1");

  const { data: targets, isLoading: loadingTargets } = useQuery<TargetDef[]>({
    queryKey: ["/api/targets"],
  });

  const { data: dailyLogs, isLoading: loadingDailyLogs } = useQuery<TargetLogDaily[]>({
    queryKey: ["/api/targets/logs/daily", today],
  });

  const { data: weeklyLogs, isLoading: loadingWeeklyLogs } = useQuery<TargetLogWeekly[]>({
    queryKey: ["/api/targets/logs/weekly", weekStart],
  });

  const dailyTargets = targets?.filter((t) => t.type === "daily" && t.active) ?? [];
  const weeklyTargets = targets?.filter((t) => t.type === "weekly" && t.active) ?? [];

  const createTargetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/targets", {
        title: newTitle,
        type: newType,
        unit: newUnit || undefined,
        targetValue: parseInt(newTargetValue) || 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      toast({ title: "Target created" });
      setAddDialogOpen(false);
      setNewTitle("");
      setNewUnit("");
      setNewTargetValue("1");
    },
    onError: (err: any) => {
      toast({ title: "Failed to create target", description: err.message, variant: "destructive" });
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/targets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      toast({ title: "Target deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await apiRequest("PATCH", `/api/targets/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const logDailyMutation = useMutation({
    mutationFn: async ({ targetId, actualValue }: { targetId: number; actualValue: number }) => {
      await apiRequest("POST", "/api/targets/logs/daily", {
        targetId,
        date: today,
        actualValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets/logs/daily"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to log", description: err.message, variant: "destructive" });
    },
  });

  const logWeeklyMutation = useMutation({
    mutationFn: async ({ targetId, actualValue }: { targetId: number; actualValue: number }) => {
      await apiRequest("POST", "/api/targets/logs/weekly", {
        targetId,
        weekStart,
        actualValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets/logs/weekly"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to log", description: err.message, variant: "destructive" });
    },
  });

  function getDailyLog(targetId: number): TargetLogDaily | undefined {
    return dailyLogs?.find((l) => l.targetId === targetId);
  }

  function getWeeklyLog(targetId: number): TargetLogWeekly | undefined {
    return weeklyLogs?.find((l) => l.targetId === targetId);
  }

  const loadingDaily = loadingTargets || loadingDailyLogs;
  const loadingWeekly = loadingTargets || loadingWeeklyLogs;

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Targets</h1>
          <p className="text-muted-foreground text-sm">Track your daily and weekly goals</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-target">
              <Plus className="w-4 h-4 mr-2" />
              Add Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="target-title">Title</Label>
                <Input
                  id="target-title"
                  placeholder="e.g. Read Quran, Solve problems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  data-testid="input-target-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-type">Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={newType === "daily" ? "default" : "outline"}
                    onClick={() => setNewType("daily")}
                    data-testid="button-type-daily"
                  >
                    Daily
                  </Button>
                  <Button
                    variant={newType === "weekly" ? "default" : "outline"}
                    onClick={() => setNewType("weekly")}
                    data-testid="button-type-weekly"
                  >
                    Weekly
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-unit">Unit (optional)</Label>
                <Input
                  id="target-unit"
                  placeholder="e.g. pages, problems, minutes"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  data-testid="input-target-unit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-value">Target Value</Label>
                <Input
                  id="target-value"
                  type="number"
                  min={1}
                  value={newTargetValue}
                  onChange={(e) => setNewTargetValue(e.target.value)}
                  data-testid="input-target-value"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createTargetMutation.mutate()}
                disabled={!newTitle.trim() || createTargetMutation.isPending}
                data-testid="button-save-new-target"
              >
                {createTargetMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Target
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily" data-testid="tab-daily-targets">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly-targets">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMM d, yyyy")}
          </p>
          {loadingDaily ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : dailyTargets.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground" data-testid="text-empty-daily">
                  Add your first target to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            dailyTargets.map((target) => {
              const log = getDailyLog(target.id);
              const actual = log?.actualValue ?? 0;
              const percent = Math.min(100, Math.round((actual / target.targetValue) * 100));
              const completed = actual >= target.targetValue;

              return (
                <TargetCard
                  key={target.id}
                  target={target}
                  actualValue={actual}
                  percent={percent}
                  completed={completed}
                  isPending={logDailyMutation.isPending}
                  onIncrement={() => {
                    logDailyMutation.mutate({ targetId: target.id, actualValue: actual + 1 });
                  }}
                  onSetValue={(val) => {
                    logDailyMutation.mutate({ targetId: target.id, actualValue: val });
                  }}
                  onDelete={() => deleteTargetMutation.mutate(target.id)}
                  onToggleActive={() =>
                    toggleActiveMutation.mutate({ id: target.id, active: !target.active })
                  }
                  deleteIsPending={deleteTargetMutation.isPending}
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Week of {format(new Date(weekStart + "T00:00:00"), "MMM d, yyyy")}
          </p>
          {loadingWeekly ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : weeklyTargets.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground" data-testid="text-empty-weekly">
                  Add your first target to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            weeklyTargets.map((target) => {
              const log = getWeeklyLog(target.id);
              const actual = log?.actualValue ?? 0;
              const percent = Math.min(100, Math.round((actual / target.targetValue) * 100));
              const completed = actual >= target.targetValue;

              return (
                <TargetCard
                  key={target.id}
                  target={target}
                  actualValue={actual}
                  percent={percent}
                  completed={completed}
                  isPending={logWeeklyMutation.isPending}
                  onIncrement={() => {
                    logWeeklyMutation.mutate({ targetId: target.id, actualValue: actual + 1 });
                  }}
                  onSetValue={(val) => {
                    logWeeklyMutation.mutate({ targetId: target.id, actualValue: val });
                  }}
                  onDelete={() => deleteTargetMutation.mutate(target.id)}
                  onToggleActive={() =>
                    toggleActiveMutation.mutate({ id: target.id, active: !target.active })
                  }
                  deleteIsPending={deleteTargetMutation.isPending}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TargetCard({
  target,
  actualValue,
  percent,
  completed,
  isPending,
  onIncrement,
  onSetValue,
  onDelete,
  onToggleActive,
  deleteIsPending,
}: {
  target: TargetDef;
  actualValue: number;
  percent: number;
  completed: boolean;
  isPending: boolean;
  onIncrement: () => void;
  onSetValue: (val: number) => void;
  onDelete: () => void;
  onToggleActive: () => void;
  deleteIsPending: boolean;
}) {
  const [editValue, setEditValue] = useState<string | null>(null);

  return (
    <Card
      className={`rounded-xl transition-all duration-200 ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5"
          : ""
      }`}
      data-testid={`card-target-${target.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {completed ? (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Target className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <CardTitle className="text-base truncate">{target.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleActive}
              data-testid={`button-toggle-active-${target.id}`}
              title={target.active ? "Deactivate" : "Activate"}
            >
              <Target className={`w-4 h-4 ${target.active ? "text-emerald-500" : "text-muted-foreground"}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              disabled={deleteIsPending}
              data-testid={`button-delete-target-${target.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {actualValue} / {target.targetValue}
            {target.unit ? ` ${target.unit}` : ""}
          </span>
          <span className={`font-medium ${completed ? "text-emerald-500" : "text-muted-foreground"}`}>
            {percent}%
          </span>
        </div>
        <Progress
          value={percent}
          className="h-2 rounded-full [&>div]:bg-emerald-500"
          data-testid={`progress-target-${target.id}`}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onIncrement}
            disabled={isPending}
            data-testid={`button-increment-${target.id}`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            +1
          </Button>
          <Input
            type="number"
            min={0}
            className="w-24"
            placeholder="Set"
            value={editValue ?? ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && editValue !== null) {
                onSetValue(parseInt(editValue) || 0);
                setEditValue(null);
              }
            }}
            data-testid={`input-value-${target.id}`}
          />
          {editValue !== null && (
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                onSetValue(parseInt(editValue) || 0);
                setEditValue(null);
              }}
              disabled={isPending}
              data-testid={`button-set-value-${target.id}`}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
