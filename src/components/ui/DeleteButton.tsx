"use client";

import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";

interface DeleteButtonProps {
  id: string;
  label?: string;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

export default function DeleteButton({ id, label = "item ini", onDelete }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const result = await onDelete(id);
        setShowConfirm(false);
        if (result?.error) {
          toast(result.error, "error");
        } else {
          toast(`Berhasil dihapus.`, "success");
          router.refresh();
        }
      } catch (e) {
        setShowConfirm(false);
        toast("Terjadi kesalahan saat menghapus.", "error");
      }
    });
  };

  return (
    <>
      {/* Tombol Hapus */}
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
        title="Hapus"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Modal Konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isPending && setShowConfirm(false)}
          />

          {/* Dialog */}
          <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            {/* Close button */}
            {!isPending && (
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-4 right-4 p-1 text-text-muted hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>

            {/* Text */}
            <h3 className="text-lg font-semibold text-center mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-text-muted text-center mb-6">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-medium text-foreground">{label}</span>?{" "}
              Aksi ini tidak dapat dibatalkan.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-background transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
