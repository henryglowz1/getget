import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check, Smartphone } from "lucide-react";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function TwoFactorSection() {
  const {
    isEnabled,
    isLoading,
    setupData,
    backupCodes,
    generateSecret,
    isGenerating,
    enable,
    isEnabling,
    disable,
    isDisabling,
    clearSetupData,
  } = useTwoFactor();

  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast({ title: "Secret copied to clipboard" });
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
      toast({ title: "Backup codes copied to clipboard" });
    }
  };

  const handleEnable = () => {
    if (verificationCode.length === 6) {
      enable(verificationCode);
      setVerificationCode("");
    }
  };

  const handleDisable = () => {
    if (disableCode.length === 6) {
      disable(disableCode);
      setDisableCode("");
      setShowDisableDialog(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isEnabled ? (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="mt-1">
                Add an extra layer of security using Google Authenticator or any TOTP app
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            // 2FA is enabled
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <ShieldCheck className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Your account is protected
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    2FA is required for login and withdrawals
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Disable 2FA
              </Button>
            </div>
          ) : setupData ? (
            // Setup in progress
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Scan QR Code</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Open Google Authenticator (or any TOTP app) and scan this QR code
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="bg-white p-2 rounded-lg border">
                        <img
                          src={setupData.qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-[180px] h-[180px]"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Can't scan? Enter this key manually:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                            {setupData.secret}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopySecret}
                          >
                            {copiedSecret ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Enter Verification Code</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    <div className="space-y-3">
                      <InputOTP
                        maxLength={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleEnable}
                          disabled={verificationCode.length !== 6 || isEnabling}
                        >
                          {isEnabling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Enable 2FA"
                          )}
                        </Button>
                        <Button variant="outline" onClick={clearSetupData}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : backupCodes ? (
            // Show backup codes after enabling
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                  Save your backup codes
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">
                  Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-background p-3 rounded border mb-3">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="font-mono text-sm">
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="w-full"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Backup Codes
                    </>
                  )}
                </Button>
              </div>
              <Button onClick={clearSetupData}>Done</Button>
            </div>
          ) : (
            // 2FA not enabled, show setup button
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Protect your account</p>
                  <p className="text-sm text-muted-foreground">
                    Enable 2FA to require a verification code for login and withdrawals
                  </p>
                </div>
              </div>
              <Button
                onClick={() => generateSecret()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Set Up 2FA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your 2FA code to confirm disabling two-factor authentication. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={disableCode}
                onChange={setDisableCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableCode.length !== 6 || isDisabling}
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}