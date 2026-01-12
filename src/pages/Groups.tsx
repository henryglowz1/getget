import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useGroups } from "@/hooks/useGroups";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: groups, isLoading } = useGroups();

  const filteredGroups = (groups || []).filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => `₦${(amount / 100).toLocaleString()}`;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Ajo Groups</h1>
            <p className="text-muted-foreground">Manage your contribution groups</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard/groups/browse">
                <Search className="w-4 h-4 mr-2" />
                Browse Public
              </Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/dashboard/groups/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          {filteredGroups.map((group) => (
            <Link
              key={group.id}
              to={`/dashboard/groups/${group.id}`}
              className="group bg-card rounded-xl border border-border/50 p-5 lg:p-6 shadow-soft hover:shadow-card hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {group.memberCount || 0} members
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  group.status === "active" 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {group.status === "active" ? "Active" : "Completed"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Cycle Progress</span>
                  <span className="font-medium text-foreground">{group.progress || 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${group.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contribution</p>
                  <p className="font-semibold text-foreground">{formatCurrency(group.contribution_amount)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{group.cycle_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">#{group.userPosition || "-"}</span>
                    <span className="text-xs text-muted-foreground">of {group.max_members}</span>
                  </div>
                </div>
              </div>

              {/* Next Payout */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  {group.status === "active" ? (
                    <>
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Cycle:</span>
                      <span className="font-medium text-foreground">{group.current_cycle || 1}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-muted-foreground">Cycle completed</span>
                    </>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term" : "Create your first Ajo group to get started"}
            </p>
            <Button variant="hero" asChild>
              <Link to="/dashboard/groups/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
