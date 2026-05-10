"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

export default function DeleteButton({ id, onDelete }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.")) {
      startTransition(async () => {
        const result = await onDelete(id);
        if (result?.error) {
          alert(result.error);
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
