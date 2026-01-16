import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { verifyTwoFactorCode } from "@/hooks/useTwoFactor";
import { toast } from "@/hooks/use-toast";

interface TwoFactorVerifyProps {
  userId: string;
  purpose: "login" | "withdrawal";
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function TwoFactorVerify({
  userId,
  purpose,
  onSuccess,
  onCancel,
  title = "Enter Verification Code",
  description = "Enter the 6-digit code from your authenticator app",
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const handleVerify = async () => {
    const codeToVerify = useBackupCode ? backupCode : code;
    
    if ((!useBackupCode && code.length !== 6) || (useBackupCode && backupCode.length !== 9)) {
      toast({
        title: "Invalid code",
        description: useBackupCode ? "Backup codes are in format XXXX-XXXX" : "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyTwoFactorCode(userId, codeToVerify, purpose);

      if (result.verified) {
        onSuccess();
      } else {
        toast({
          title: "Verification failed",
          description: result.error || "Invalid code. Please try again.",
          variant: "destructive",
        });
        setCode("");
        setBackupCode("");
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {!useBackupCode ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setUseBackupCode(true)}
              className="text-sm text-primary hover:underline"
            >
              Use a backup code instead
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <input
              id="backup-code"
              type="text"
              placeholder="XXXX-XXXX"
              value={backupCode}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                // Auto-add hyphen after 4 characters
                if (value.length === 4 && !value.includes("-")) {
                  value = value + "-";
                }
                if (value.length <= 9) {
                  setBackupCode(value);
                }
              }}
              className="w-full text-center text-lg font-mono tracking-widest border rounded-md py-2 px-3"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={backupCode.length !== 9 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify with Backup Code"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(false);
                setBackupCode("");
              }}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Use authenticator app instead
            </button>
          </div>
        </div>
      )}

      <Button variant="ghost" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
}