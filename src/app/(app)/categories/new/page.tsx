import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CategoryForm from "./category-form";
import { formatCategoryName } from "@/utils/category";

export default async function NewCategoryPage() {
  const supabase = await createClient();
  
  // Get all category codes to find the highest sequence number (K-0001 format)
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, code, parent_id")
    .order("name");
    
  let maxNum = 0;
  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      if (cat.code && cat.code.startsWith("K-")) {
        const num = parseInt(cat.code.replace("K-", ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }
    
  const nextNum = maxNum + 1;
  const nextCode = `K-${nextNum.toString().padStart(4, '0')}`;

  // Format category options hierarchically
  const categoryOptions = (categories || []).map(cat => ({
    id: cat.id,
    label: formatCategoryName(cat, categories || [])
  })).sort((a, b) => a.label.localeCompare(b.label));

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
        <CategoryForm nextCode={nextCode} categories={categoryOptions} />
      </div>
    </div>
  );
}
