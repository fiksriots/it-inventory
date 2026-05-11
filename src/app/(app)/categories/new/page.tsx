import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CategoryForm from "./category-form";

export default async function NewCategoryPage() {
  const supabase = await createClient();
  
  // Get the count to generate the next code (K-0001 format)
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
    
  const nextNum = (count || 0) + 1;
  const nextCode = `K-${nextNum.toString().padStart(4, '0')}`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/categories" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tambah Kategori Baru</h1>
          <p className="text-text-muted mt-1">Buat kategori baru untuk mengelompokkan barang.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <CategoryForm nextCode={nextCode} />
      </div>
    </div>
  );
}
