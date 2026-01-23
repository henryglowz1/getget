import { Bell, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();
  const { toast } = useToast();

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;
    
    try {
      await updatePreferences.mutateAsync({ [key]: value });
      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Failed to update",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
      <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        Notifications
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
          </div>
          <Switch
            checked={preferences?.email_enabled ?? true}
            onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
            disabled={updatePreferences.isPending}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
            </div>
          </div>
          <Switch
            checked={preferences?.push_enabled ?? true}
            onCheckedChange={(checked) => handleToggle("push_enabled", checked)}
            disabled={updatePreferences.isPending}
          />
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Notification Types</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Contribution Reminders</p>
                <p className="text-sm text-muted-foreground">Remind me before debit dates</p>
              </div>
              <Switch
                checked={preferences?.contribution_reminders ?? true}
                onCheckedChange={(checked) => handleToggle("contribution_reminders", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Group Updates</p>
                <p className="text-sm text-muted-foreground">New members, invites, and group changes</p>
              </div>
              <Switch
                checked={preferences?.group_updates ?? true}
                onCheckedChange={(checked) => handleToggle("group_updates", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Payment Alerts</p>
                <p className="text-sm text-muted-foreground">Successful payments and payouts</p>
              </div>
              <Switch
                checked={preferences?.payment_alerts ?? true}
                onCheckedChange={(checked) => handleToggle("payment_alerts", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
