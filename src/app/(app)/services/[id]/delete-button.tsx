"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteService } from "../actions";
import { useRouter } from "next/navigation";

interface DeleteServiceButtonProps {
  id: string;
  serviceNumber: string;
}

export default function DeleteServiceButton({ id, serviceNumber }: DeleteServiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus catatan service ${serviceNumber}?\n\nTindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteService(id);
      
      if (result.success) {
        alert("Catatan service berhasil dihapus.");
        router.push("/services");
        router.refresh();
      } else {
        alert(result.error || "Gagal menghapus data service.");
        setIsDeleting(false);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menghapus data.");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2.5 border border-rose-500/50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm flex items-center gap-2 text-sm font-bold"
      title="Hapus Dokumen Service"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      )}
      <span className="hidden sm:inline">Hapus Dokumen</span>
    </button>
  );
}
