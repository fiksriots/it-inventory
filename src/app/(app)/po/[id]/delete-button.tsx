"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deletePO } from "../actions";
import { useRouter } from "next/navigation";

interface DeletePOButtonProps {
  id: string;
  status: string;
}

export default function DeletePOButton({ id, status }: DeletePOButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    // 1. Konfirmasi sebelum hapus
    let message = "Apakah Anda yakin ingin menghapus Purchase Order ini?\n\nSemua data barang di dalamnya akan ikut terhapus dan tindakan ini tidak dapat dibatalkan.";
    
    if (status === "Selesai") {
      message = "PERHATIAN: PO ini sudah SELESAI (stok sudah bertambah).\n\nMenghapus PO ini tidak akan mengurangi stok yang sudah masuk secara otomatis.\n\nApakah Anda tetap yakin ingin menghapus dokumen ini?";
    }

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deletePO(id);
      
      if (result.success) {
        // 2. Notifikasi sukses
        alert("Purchase Order berhasil dihapus.");
        
        // 3. Redirect ke halaman daftar PO
        router.push("/po");
        router.refresh();
      } else {
        alert(result.error || "Gagal menghapus PO.");
        setIsDeleting(false);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menghapus PO.");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 border border-rose-500/50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
      title="Hapus PO"
    >
      {isDeleting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}
