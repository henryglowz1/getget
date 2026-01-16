import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

interface TwoFactorStatus {
  isEnabled: boolean;
}

export function useTwoFactor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Query to get 2FA status
  const { data: status, isLoading: statusLoading } = useQuery<TwoFactorStatus>({
    queryKey: ["two-factor-status", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "status" },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data.data;
    },
    enabled: !!user,
  });

  // Mutation to generate new TOTP secret
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "generate" },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data.data as TwoFactorSetupData;
    },
    onSuccess: (data) => {
      setSetupData(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate 2FA setup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to enable 2FA
  const enableMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "enable", code },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data.data as { backupCodes: string[] };
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setSetupData(null);
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to disable 2FA
  const disableMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "disable", code },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      setBackupCodes(null);
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearSetupData = () => {
    setSetupData(null);
    setBackupCodes(null);
  };

  return {
    isEnabled: status?.isEnabled || false,
    isLoading: statusLoading,
    setupData,
    backupCodes,
    generateSecret: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    enable: enableMutation.mutate,
    isEnabling: enableMutation.isPending,
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
    clearSetupData,
  };
}

// Utility function to verify 2FA code (for login and withdrawals)
export async function verifyTwoFactorCode(
  userId: string,
  code: string,
  purpose: "login" | "withdrawal"
): Promise<{ verified: boolean; twoFactorRequired: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("totp-verify", {
      body: { user_id: userId, code, purpose },
    });

    if (error) {
      return { verified: false, twoFactorRequired: true, error: error.message };
    }

    if (!data.success) {
      return { verified: false, twoFactorRequired: true, error: data.error };
    }

    return {
      verified: data.data.verified,
      twoFactorRequired: data.data.twoFactorRequired,
    };
  } catch (err: any) {
    return { verified: false, twoFactorRequired: true, error: err.message };
  }
}

// Check if user has 2FA enabled (for pre-login check)
export async function check2FAStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("check-2fa-status", {
      body: { user_id: userId },
    });

    if (error || !data.success) {
      console.error("Failed to check 2FA status:", error || data.error);
      return false;
    }

    return data.data.isEnabled;
  } catch (err) {
    console.error("Error checking 2FA status:", err);
    return false;
  }
}