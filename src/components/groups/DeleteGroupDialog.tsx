import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteGroupDialogProps {
  groupName: string;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteGroupDialog({
  groupName,
  onDelete,
  isDeleting,
}: DeleteGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === groupName;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    await onDelete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmText(""); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Group
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              This will permanently delete <span className="font-semibold text-foreground">{groupName}</span> and remove all members. 
              Any pending contributions or payouts will be lost.
            </span>
            <span className="block text-destructive font-medium">
              This action cannot be undone.
            </span>
            <span className="block text-sm">
              Type <span className="font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{groupName}</span> to confirm:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={groupName}
          className="mt-2"
        />
        <AlertDialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
