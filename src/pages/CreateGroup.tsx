import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Calendar,
  Wallet,
  Info,
  Globe,
  Lock,
  Percent
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateGroup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    cycleType: "monthly",
    startDate: "",
    maxMembers: "",
    isPublic: false,
    feePercentage: "6.25"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to create a group.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the ajo group
      const { data: ajo, error: ajoError } = await supabase
        .from("ajos")
        .insert({
          name: formData.name,
          description: formData.description || null,
          contribution_amount: parseInt(formData.contributionAmount) * 100, // Convert to kobo
          cycle_type: formData.cycleType,
          start_date: formData.startDate,
          max_members: parseInt(formData.maxMembers),
          creator_id: user.id,
          status: "active",
          current_cycle: 1,
          is_public: formData.isPublic,
          fee_percentage: parseFloat(formData.feePercentage),
        })
        .select()
        .single();

      if (ajoError) throw ajoError;

      // Add creator as first member
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          ajo_id: ajo.id,
          user_id: user.id,
          position: 1,
          is_active: true,
        });

      if (membershipError) throw membershipError;

      // Invalidate groups query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      toast({
        title: "Group created!",
        description: "Your Ajo group has been created successfully.",
      });
      
      navigate(`/dashboard/groups/${ajo.id}`);
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({
        title: "Failed to create group",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the group..."
                className="flex min-h-20 w-full rounded-lg border border-input bg-card px-4 py-3 text-base ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:border-primary/50 resize-none"
                value={formData.description}
                onChange={handleChange}
              />
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

            {/* Platform Fee */}
            <div className="space-y-2">
              <Label htmlFor="feePercentage">Platform Fee (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="feePercentage"
                  name="feePercentage"
                  type="number"
                  placeholder="6.25"
                  className="pl-11"
                  value={formData.feePercentage}
                  onChange={handleChange}
                  required
                  min="0"
                  max="20"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">Fee deducted from payouts (0-20%)</p>
            </div>

            {/* Public Group Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                {formData.isPublic ? (
                  <Globe className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {formData.isPublic ? "Public Group" : "Private Group"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic
                      ? "Anyone can discover and request to join"
                      : "Only invited members can join"}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublic: checked }))
                }
              />
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
