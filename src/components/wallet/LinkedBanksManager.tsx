import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLinkedBanks, LinkedBank } from "@/hooks/useLinkedBanks";
import { Building2, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { AddBankModal } from "./AddBankModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function LinkedBanksManager() {
  const { data: banks, isLoading } = useLinkedBanks();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bankToDelete, setBankToDelete] = useState<LinkedBank | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!bankToDelete) return;

    setDeletingId(bankToDelete.id);
    try {
      const { error } = await supabase
        .from("linked_banks")
        .delete()
        .eq("id", bankToDelete.id);

      if (error) throw error;

      toast.success("Bank account removed");
      queryClient.invalidateQueries({ queryKey: ["linked_banks", user?.id] });
    } catch (error: any) {
      toast.error("Failed to remove bank account");
    } finally {
      setDeletingId(null);
      setBankToDelete(null);
    }
  };

  const handleSetDefault = async (bank: LinkedBank) => {
    try {
      // First, unset all defaults
      await supabase
        .from("linked_banks")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      // Then set the new default
      const { error } = await supabase
        .from("linked_banks")
        .update({ is_default: true })
        .eq("id", bank.id);

      if (error) throw error;

      toast.success("Default bank updated");
      queryClient.invalidateQueries({ queryKey: ["linked_banks", user?.id] });
    } catch (error: any) {
      toast.error("Failed to update default bank");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-soft">
      <div className="p-4 lg:p-6 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Linked Bank Accounts</h2>
        <Button size="sm" onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bank
        </Button>
      </div>

      <div className="p-4 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading banks...
          </div>
        ) : !banks || banks.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No bank accounts linked yet</p>
            <Button variant="outline" onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Bank
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{bank.bank_name}</p>
                    {bank.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-secondary/20 text-secondary rounded-full">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{bank.account_name}</p>
                  <p className="text-sm text-muted-foreground">
                    ****{bank.account_number.slice(-4)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!bank.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(bank)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setBankToDelete(bank)}
                    disabled={deletingId === bank.id}
                  >
                    {deletingId === bank.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddBankModal open={addModalOpen} onOpenChange={setAddModalOpen} />

      <AlertDialog open={!!bankToDelete} onOpenChange={() => setBankToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {bankToDelete?.bank_name} (****
              {bankToDelete?.account_number.slice(-4)})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
