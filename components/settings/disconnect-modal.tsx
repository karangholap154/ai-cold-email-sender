"use client";

import { AlertCircle, Mail, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface DisconnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  isDisconnecting: boolean;
  onDisconnect: () => void;
}

export function DisconnectModal({
  open,
  onOpenChange,
  email,
  isDisconnecting,
  onDisconnect,
}: DisconnectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-hairline bg-paper text-ink sm:max-w-md p-5 sm:p-6">
        <DialogHeader className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Disconnect Gmail</span>
          </div>
          <DialogTitle className="font-heading text-lg sm:text-xl text-ink">
            Disconnect your Gmail account?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-ink leading-relaxed">
            You will no longer be able to send tailored letters directly from your personal address until you reconnect Google OAuth in Settings.
          </DialogDescription>
        </DialogHeader>

        {email && (
          <div className="my-2 rounded-sm border border-hairline bg-[#FAF9F5] p-3 text-xs flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-muted-ink shrink-0" />
            <div className="min-w-0">
              <p className="font-mono text-ink font-medium truncate">{email}</p>
              <p className="text-[11px] text-muted-ink mt-0.5">Direct personal OAuth dispatch</p>
            </div>
          </div>
        )}

        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isDisconnecting}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-sm border border-hairline text-xs font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
          >
            Keep connected
          </button>
          <button
            type="button"
            disabled={isDisconnecting}
            onClick={onDisconnect}
            className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-red-800 hover:bg-red-900 px-4 py-2 text-xs font-medium text-paper shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDisconnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Disconnect account</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
