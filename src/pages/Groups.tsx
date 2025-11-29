import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  TrendingUp,
  ChevronRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const groups = [
  { 
    id: 1, 
    name: "Friends Circle", 
    members: 10, 
    contribution: "₦10,000", 
    cycle: "Monthly", 
    nextPayout: "Dec 15, 2024",
    totalPool: "₦100,000",
    position: 3,
    status: "active",
    progress: 30
  },
  { 
    id: 2, 
    name: "Family Savings", 
    members: 5, 
    contribution: "₦20,000", 
    cycle: "Monthly", 
    nextPayout: "Jan 1, 2025",
    totalPool: "₦100,000",
    position: 2,
    status: "active",
    progress: 60
  },
  { 
    id: 3, 
    name: "Office Group", 
    members: 8, 
    contribution: "₦5,000", 
    cycle: "Weekly", 
    nextPayout: "Dec 2, 2024",
    totalPool: "₦40,000",
    position: 5,
    status: "active",
    progress: 45
  },
  { 
    id: 4, 
    name: "Neighborhood Ajo", 
    members: 12, 
    contribution: "₦15,000", 
    cycle: "Monthly", 
    nextPayout: "Completed",
    totalPool: "₦180,000",
    position: 1,
    status: "completed",
    progress: 100
  },
];

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Ajo Groups</h1>
            <p className="text-muted-foreground">Manage your contribution groups</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard/groups/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Link>
          </Button>
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
                      {group.members} members
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
                  <span className="font-medium text-foreground">{group.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${group.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contribution</p>
                  <p className="font-semibold text-foreground">{group.contribution}</p>
                  <p className="text-xs text-muted-foreground">{group.cycle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">#{group.position}</span>
                    <span className="text-xs text-muted-foreground">of {group.members}</span>
                  </div>
                </div>
              </div>

              {/* Next Payout */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  {group.status === "active" ? (
                    <>
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Next payout:</span>
                      <span className="font-medium text-foreground">{group.nextPayout}</span>
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
