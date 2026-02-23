import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { User, Moon, Sun, Save, Lock, Camera, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState(user?.username || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usernameMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/set-username", { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Username updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/profile/update", { fullName, bio });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Avatar updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to upload", description: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast({ title: "Password updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
        return;
      }
      avatarMutation.mutate(file);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {(user?.fullName || user?.username || user?.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                data-testid="button-change-avatar"
              >
                {avatarMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                data-testid="input-avatar-file"
              />
            </div>
            <div>
              <p className="font-medium">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              data-testid="input-full-name-settings"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              data-testid="input-bio-settings"
            />
          </div>
          <Button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
            data-testid="button-save-profile"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>

          <hr className="my-2" />

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled data-testid="input-email-display" />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-username-settings"
            />
          </div>
          <Button
            onClick={() => usernameMutation.mutate()}
            disabled={usernameMutation.isPending || username === user?.username}
            data-testid="button-save-username"
          >
            <Save className="w-4 h-4 mr-2" />
            Update Username
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
            {newPassword && <PasswordStrengthMeter password={newPassword} />}
          </div>
          <Button
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !currentPassword || !newPassword}
            data-testid="button-change-password"
          >
            <Save className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
