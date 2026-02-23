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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Shield, ShieldOff, Ban, CheckCircle, Eye, MoreHorizontal, Pause, Key } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { StatusBadge } from "./admin";

export default function AdminUsersPage() {
  const { toast } = useToast();

  const { data: usersList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset token generated",
        description: `Token: ${data.token.substring(0, 16)}... (copied to clipboard)`,
      });
      navigator.clipboard.writeText(data.token).catch(() => {});
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">Manage all users, roles, and account status</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList?.map((u: any) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.username || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${u.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/admin/users/${u.id}`}>
                              <DropdownMenuItem data-testid={`link-view-user-${u.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => roleMutation.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                              data-testid={`button-toggle-role-${u.id}`}
                            >
                              {u.role === "admin" ? <ShieldOff className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                              {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {u.status === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => statusMutation.mutate({ userId: u.id, status: "suspended" })}
                                  data-testid={`button-suspend-${u.id}`}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => statusMutation.mutate({ userId: u.id, status: "banned" })}
                                  className="text-destructive"
                                  data-testid={`button-ban-${u.id}`}
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban
                                </DropdownMenuItem>
                              </>
                            )}
                            {u.status !== "active" && (
                              <DropdownMenuItem
                                onClick={() => statusMutation.mutate({ userId: u.id, status: "active" })}
                                data-testid={`button-activate-${u.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => resetPasswordMutation.mutate(u.id)}
                              data-testid={`button-reset-pw-${u.id}`}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Generate Reset Token
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
