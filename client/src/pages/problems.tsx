import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Flame, Plus, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProblemLog } from "@shared/schema";

export default function ProblemsPage() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const [solvedCount, setSolvedCount] = useState(0);
  const [platform, setPlatform] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");

  const { data: todayLog, isLoading } = useQuery<ProblemLog | null>({
    queryKey: ["/api/problems", today],
  });

  const { data: streakData } = useQuery<any>({
    queryKey: ["/api/problems/streak"],
  });

  const { data: chartData } = useQuery<any[]>({
    queryKey: ["/api/problems/chart"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/problems", { ...data, date: today });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems/chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Problem log saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      solvedCount: solvedCount || todayLog?.solvedCount || 0,
      platform: platform || todayLog?.platform || "",
      links: links.length > 0 ? links : todayLog?.links || [],
      tags: tags ? tags.split(",").map((t) => t.trim()) : todayLog?.tags || [],
      note: note || todayLog?.note || "",
    });
  };

  const addLink = () => {
    if (newLink.trim()) {
      setLinks([...links, newLink.trim()]);
      setNewLink("");
    }
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Problem Solving</h1>
          <p className="text-muted-foreground text-sm">Track your daily coding practice</p>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-semibold" data-testid="text-problem-streak">
            {streakData?.currentStreak ?? 0} day streak
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Log Today's Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Problems Solved</Label>
                  <Input
                    type="number"
                    min={0}
                    value={solvedCount || todayLog?.solvedCount || 0}
                    onChange={(e) => setSolvedCount(parseInt(e.target.value) || 0)}
                    data-testid="input-solved-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Input
                    placeholder="e.g. LeetCode, Codeforces, HackerRank"
                    value={platform || todayLog?.platform || ""}
                    onChange={(e) => setPlatform(e.target.value)}
                    data-testid="input-platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Problem Links</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://leetcode.com/problem/..."
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                      data-testid="input-link"
                    />
                    <Button size="icon" variant="secondary" onClick={addLink} data-testid="button-add-link">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(links.length > 0 ? links : todayLog?.links || []).map((link, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <a href={link} target="_blank" rel="noopener" className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[120px] truncate">{link}</span>
                        </a>
                        <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g. dp, graphs, binary-search"
                    value={tags || todayLog?.tags?.join(", ") || ""}
                    onChange={(e) => setTags(e.target.value)}
                    data-testid="input-tags"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="What did you learn today?"
                    value={note || todayLog?.note || ""}
                    onChange={(e) => setNote(e.target.value)}
                    data-testid="textarea-problem-note"
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending} data-testid="button-save-problems">
                  Save Progress
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Streak Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">{streakData?.currentStreak ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Current</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{streakData?.longestStreak ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Longest</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{streakData?.weeklyTotal ?? 0}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No data yet. Start solving problems!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
