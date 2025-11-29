import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Shield, 
  Users, 
  Zap, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Wallet,
  Building2
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Group Savings (Ajo)",
    description: "Create or join contribution groups with automatic rotational payouts. Build wealth together with trusted members."
  },
  {
    icon: CreditCard,
    title: "Card Linking",
    description: "Securely link your debit card once. We'll handle automatic debits on your contribution dates."
  },
  {
    icon: Clock,
    title: "Automated Debits",
    description: "Never miss a contribution. Set your schedule and let our system handle the rest automatically."
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your money is protected with industry-leading encryption and Paystack's secure payment infrastructure."
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your savings growth, contribution history, and upcoming payouts in real-time."
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    description: "Receive your payout directly to your bank account when it's your turn. Fast and reliable."
  }
];

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Sign up in minutes with your email and phone number. Verify your identity securely."
  },
  {
    step: "02",
    title: "Join or Create a Group",
    description: "Find an existing Ajo group or create your own. Set contribution amounts and cycle frequency."
  },
  {
    step: "03",
    title: "Link Your Card",
    description: "Add your debit card securely. We use Paystack's tokenization for maximum security."
  },
  {
    step: "04",
    title: "Sit Back & Save",
    description: "Contributions are automated. Track your progress and receive payouts on schedule."
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Shield className="w-4 h-4" />
              Trusted by 10,000+ savers across Nigeria
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Automated Savings,{" "}
              <span className="text-gradient-primary">Traditional Trust</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Join the modern Ajo revolution. Link your card once, automate your contributions, 
              and watch your savings grow with community accountability.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Start Saving Today
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-12 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">PCI DSS Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-sm">CBN Licensed</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm">256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Save Smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make group savings effortless and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 lg:p-8 bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-card hover:border-primary/20 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How AjoConnect Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in four simple steps. No complex setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Savings?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of Nigerians who are building wealth together with automated Ajo contributions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link to="/login">
                  I Already Have an Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">AjoConnect</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AjoConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
