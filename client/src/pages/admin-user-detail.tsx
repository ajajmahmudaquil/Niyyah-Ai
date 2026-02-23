import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, BookOpen, Code2, StickyNote, Target } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { StatusBadge } from "./admin";
import { ConsistencyBadge } from "@/components/consistency-badge";

export default function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const { toast } = useToast();
  const userId = params.userId;

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/users", userId],
  });

  const deletePrayerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/content/prayer/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      toast({ title: "Prayer log deleted" });
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/content/problem/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      toast({ title: "Problem log deleted" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/content/note/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      toast({ title: "Note deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p>User not found</p>
      </div>
    );
  }

  const { user, prayerLogs, problemLogs, notes, dailyTargets, weeklyTargets, consistencyScore, prayerStreak, problemStreak } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" data-testid="button-back-users">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.username || user.email}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={user.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsistencyBadge score={Math.round(consistencyScore)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prayer Streak</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Current: <strong>{prayerStreak.currentStreak}</strong> days</div>
            <div>Longest: <strong>{prayerStreak.longestStreak}</strong> days</div>
            <div>Weekly: <strong>{prayerStreak.weeklyPercent}%</strong></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Problem Streak</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Current: <strong>{problemStreak.currentStreak}</strong> days</div>
            <div>Longest: <strong>{problemStreak.longestStreak}</strong> days</div>
            <div>Weekly Total: <strong>{problemStreak.weeklyTotal}</strong></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prayers">
        <TabsList>
          <TabsTrigger value="prayers" data-testid="tab-prayers">
            <BookOpen className="w-4 h-4 mr-1" /> Prayers ({prayerLogs.length})
          </TabsTrigger>
          <TabsTrigger value="problems" data-testid="tab-problems">
            <Code2 className="w-4 h-4 mr-1" /> Problems ({problemLogs.length})
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">
            <StickyNote className="w-4 h-4 mr-1" /> Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="targets" data-testid="tab-targets">
            <Target className="w-4 h-4 mr-1" /> Targets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prayers">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fajr</TableHead>
                    <TableHead>Dhuhr</TableHead>
                    <TableHead>Asr</TableHead>
                    <TableHead>Maghrib</TableHead>
                    <TableHead>Isha</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prayerLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{log.date}</TableCell>
                      <TableCell>{log.fajr ? "Y" : "-"}</TableCell>
                      <TableCell>{log.dhuhr ? "Y" : "-"}</TableCell>
                      <TableCell>{log.asr ? "Y" : "-"}</TableCell>
                      <TableCell>{log.maghrib ? "Y" : "-"}</TableCell>
                      <TableCell>{log.isha ? "Y" : "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePrayerMutation.mutate(log.id)}
                          data-testid={`button-delete-prayer-${log.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prayerLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">No prayer logs</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Solved</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{log.date}</TableCell>
                      <TableCell>{log.solvedCount}</TableCell>
                      <TableCell className="text-sm">{log.platform || "-"}</TableCell>
                      <TableCell className="text-sm">{log.tags?.join(", ") || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProblemMutation.mutate(log.id)}
                          data-testid={`button-delete-problem-${log.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {problemLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No problem logs</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note: any) => (
                    <TableRow key={note.id}>
                      <TableCell className="text-sm">{note.date}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{note.content}</TableCell>
                      <TableCell className="text-sm">{note.tags?.join(", ") || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {notes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No notes</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prayers</TableHead>
                      <TableHead>Problems</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyTargets.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{t.date}</TableCell>
                        <TableCell>{t.prayersTarget}</TableCell>
                        <TableCell>{t.problemsTarget}</TableCell>
                        <TableCell>{t.notesTarget}</TableCell>
                      </TableRow>
                    ))}
                    {dailyTargets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No daily targets</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weekly Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week Start</TableHead>
                      <TableHead>Problems</TableHead>
                      <TableHead>Consistency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyTargets.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{t.weekStart}</TableCell>
                        <TableCell>{t.weeklyProblemsTarget}</TableCell>
                        <TableCell>{t.weeklyConsistencyTargetPercent}%</TableCell>
                      </TableRow>
                    ))}
                    {weeklyTargets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No weekly targets</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
