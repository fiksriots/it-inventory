"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useToast } from "./ToastProvider";

interface DeleteButtonProps {
  id: string;
  label?: string;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

export default function DeleteButton({ id, label = "data ini", onDelete }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${label}? Aksi ini tidak dapat dibatalkan.`)) {
      startTransition(async () => {
        const result = await onDelete(id);
        if (result?.error) {
          toast(result.error, "error");
        } else {
          toast(`${label.charAt(0).toUpperCase() + label.slice(1)} berhasil dihapus.`, "success");
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-50"
      title="Hapus"
    >
      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
    </button>
  );
}
