import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Bank {
  name: string;
  code: string;
}

interface AddBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBankModal({ open, onOpenChange }: AddBankModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (open && banks.length === 0) {
      fetchBanks();
    }
  }, [open]);

  useEffect(() => {
    setVerifiedName(null);
    setVerifyError(null);
  }, [selectedBank, accountNumber]);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-bank-account", {
        body: { action: "list_banks" },
      });

      if (error) throw error;
      setBanks(data.banks || []);
    } catch (error: any) {
      toast.error("Failed to load banks");
    } finally {
      setLoadingBanks(false);
    }
  };

  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;

    setVerifying(true);
    setVerifyError(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-bank-account", {
        body: {
          action: "verify",
          account_number: accountNumber,
          bank_code: selectedBank,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setVerifiedName(data.account_name);
    } catch (error: any) {
      setVerifyError(error.message || "Could not verify account");
    } finally {
      setVerifying(false);
    }
  };

  const handleAdd = async () => {
    if (!verifiedName || !selectedBank) return;

    const bankInfo = banks.find((b) => b.code === selectedBank);
    if (!bankInfo) return;

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-bank-account", {
        body: {
          action: "add",
          account_number: accountNumber,
          bank_code: selectedBank,
          bank_name: bankInfo.name,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Bank account added successfully");
      queryClient.invalidateQueries({ queryKey: ["linked_banks", user?.id] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to add bank account");
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setSelectedBank("");
    setAccountNumber("");
    setVerifiedName(null);
    setVerifyError(null);
  };

  const canVerify = selectedBank && accountNumber.length === 10 && !verifiedName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Bank Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Bank</Label>
            {loadingBanks ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading banks...
              </div>
            ) : (
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bank" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {canVerify && (
            <Button
              variant="outline"
              className="w-full"
              onClick={verifyAccount}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          )}

          {verifiedName && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-success">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{verifiedName}</span>
            </div>
          )}

          {verifyError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{verifyError}</span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!verifiedName || adding}
            onClick={handleAdd}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Bank Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
