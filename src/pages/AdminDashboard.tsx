import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScheduledContributionsTable } from "@/components/admin/ScheduledContributionsTable";
import { FailedPaymentsTable } from "@/components/admin/FailedPaymentsTable";
import { PlatformFeesSection } from "@/components/admin/PlatformFeesSection";
import { useAdminContributions } from "@/hooks/useAdminContributions";
import { Clock, XCircle, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const {
    scheduledContributions,
    failedPayments,
    isLoadingScheduled,
    isLoadingFailed,
    retryContribution,
    isRetrying,
    resetRetryCount,
    isResetting,
  } = useAdminContributions();

  // Calculate stats
  const overdueCount = scheduledContributions.filter((c) => {
    if (!c.next_debit_date) return false;
    const date = new Date(c.next_debit_date);
    return date < new Date() && !isToday(date);
  }).length;

  const maxRetriesCount = scheduledContributions.filter(
    (c) => (c.retry_count || 0) >= 3
  ).length;

  const dueTodayCount = scheduledContributions.filter((c) => {
    if (!c.next_debit_date) return false;
    return isToday(new Date(c.next_debit_date));
  }).length;

  function isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  const handleRetry = async (membershipId: string, ajoId: string) => {
    await retryContribution({ membershipId, ajoId });
  };

  const handleResetRetry = async (membershipId: string) => {
    await resetRetryCount(membershipId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage scheduled contributions and failed payments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{scheduledContributions.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold">{dueTodayCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold text-destructive">{overdueCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold text-destructive">{failedPayments.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="scheduled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduled" className="gap-2">
              <Clock className="w-4 h-4" />
              Scheduled Contributions
              {scheduledContributions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {scheduledContributions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="failed" className="gap-2">
              <XCircle className="w-4 h-4" />
              Failed Payments
              {failedPayments.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {failedPayments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Platform Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Contributions</CardTitle>
                <CardDescription>
                  View all scheduled automatic contributions and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduledContributionsTable
                  contributions={scheduledContributions}
                  isLoading={isLoadingScheduled}
                  onRetry={handleRetry}
                  onResetRetry={handleResetRetry}
                  isRetrying={isRetrying}
                  isResetting={isResetting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed">
            <Card>
              <CardHeader>
                <CardTitle>Failed Payments</CardTitle>
                <CardDescription>
                  View failed contribution attempts and retry them manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FailedPaymentsTable
                  payments={failedPayments}
                  isLoading={isLoadingFailed}
                  onRetry={handleRetry}
                  isRetrying={isRetrying}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <PlatformFeesSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
