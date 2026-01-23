import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReferralSection } from "@/components/settings/ReferralSection";
import { ReferralLeaderboard } from "@/components/settings/ReferralLeaderboard";
import { TwoFactorSection } from "@/components/settings/TwoFactorSection";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { 
  User, 
  Mail, 
  Phone, 
  Building2,
  Save,
  AtSign,
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useUsernameRequired } from "@/hooks/useUsernameRequired";

export default function Settings() {
  const { toast } = useToast();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { username } = useUsernameRequired();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bankName: "",
        accountNumber: "",
        accountName: ""
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateProfile({
        full_name: formData.name,
        phone: formData.phone,
      });
      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <div className="space-y-8">
          {/* Referral Section */}
          <ReferralSection />

          {/* Referral Leaderboard */}
          <ReferralLeaderboard />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Section */}
            <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
              <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Username - Read only */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username || "Not set"}
                      className="pl-11"
                      disabled
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Username cannot be changed once set</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className="pl-11"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="pl-11"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
              <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Bank Details (for Payouts)
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g., GTBank, Access Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Account name is verified automatically via Paystack
                  </p>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <TwoFactorSection />

            {/* Notifications */}
            <NotificationSettings />

            {/* Save Button */}
            <Button type="submit" variant="hero" size="lg" disabled={isLoading || profileLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
