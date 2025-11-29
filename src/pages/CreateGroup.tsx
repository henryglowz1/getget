import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Calendar,
  Wallet,
  Info
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CreateGroup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contributionAmount: "",
    cycleType: "monthly",
    startDate: "",
    maxMembers: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Group created!",
        description: "Your Ajo group has been created successfully.",
      });
      navigate("/dashboard/groups");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/dashboard/groups">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Groups
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Create New Ajo Group</h1>
          <p className="text-muted-foreground">Set up a new contribution group for your community</p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Friends Circle, Family Savings"
                  className="pl-11"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Contribution Amount */}
            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Contribution Amount (₦)</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="contributionAmount"
                  name="contributionAmount"
                  type="number"
                  placeholder="10000"
                  className="pl-11"
                  value={formData.contributionAmount}
                  onChange={handleChange}
                  required
                  min="1000"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum ₦1,000 per contribution</p>
            </div>

            {/* Cycle Type */}
            <div className="space-y-2">
              <Label htmlFor="cycleType">Contribution Cycle</Label>
              <select
                id="cycleType"
                name="cycleType"
                value={formData.cycleType}
                onChange={handleChange}
                className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-base ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:border-primary/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="pl-11"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Maximum Members</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  placeholder="10"
                  className="pl-11"
                  value={formData.maxMembers}
                  onChange={handleChange}
                  required
                  min="2"
                  max="50"
                />
              </div>
              <p className="text-xs text-muted-foreground">2-50 members per group</p>
            </div>

            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">How Ajo Works</p>
                <p className="text-sm text-muted-foreground">
                  Each member contributes the set amount on schedule. Members receive the total pool 
                  in rotation based on their position. Everyone contributes, everyone benefits.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link to="/dashboard/groups">Cancel</Link>
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Group"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
