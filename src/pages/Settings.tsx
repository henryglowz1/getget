import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  Building2,
  Shield,
  Bell,
  Save
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "08012345678",
    bankName: "GTBank",
    accountNumber: "0123456789",
    accountName: "John Doe"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

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
                  />
                </div>
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

          {/* Security */}
          <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
            <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </h2>
            
            <div className="space-y-4">
              <Button type="button" variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button type="button" variant="outline" className="w-full justify-start">
                Enable Two-Factor Authentication
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
            <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">SMS Alerts</p>
                  <p className="text-sm text-muted-foreground">Get SMS for important transactions</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Contribution Reminders</p>
                  <p className="text-sm text-muted-foreground">Remind me before debit dates</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <Button type="submit" variant="hero" size="lg" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
