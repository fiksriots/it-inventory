"use client";

import React, { useState, useMemo } from "react";
import { Plus, Tags, Edit, ShoppingCart, ChevronDown, Search, Info } from "lucide-react";
import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteCategory } from "./actions";
import CategoryItemsModal from "./category-items-modal";

interface CategoriesClientProps {
  initialCategories: any[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // paginating parent categories only

  // Helper to count items recursively
  const getCumulativeItemCount = (categoryId: string): number => {
    const cat = initialCategories.find(c => c.id === categoryId);
    if (!cat) return 0;
    
    const directCount = cat.items?.[0]?.count || 0;
    const children = initialCategories.filter(c => c.parent_id === categoryId);
    
    let totalCount = directCount;
    for (const child of children) {
      totalCount += getCumulativeItemCount(child.id);
    }
    
    return totalCount;
  };

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build tree and filter
  const { filteredTree, totalRootCount } = useMemo(() => {
    // 1. Build tree structure
    const map: { [key: string]: any } = {};
    initialCategories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    
    const roots: any[] = [];
    initialCategories.forEach(cat => {
      const node = map[cat.id];
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 2. Filter tree based on search term
    if (!searchTerm.trim()) {
      return { filteredTree: roots, totalRootCount: roots.length };
    }

    const query = searchTerm.toLowerCase().trim();
    const autoExpandList = new Set<string>();

    const checkNode = (node: any): boolean => {
      const nameMatches = node.name.toLowerCase().includes(query) || 
                          (node.code && node.code.toLowerCase().includes(query)) ||
                          (node.description && node.description.toLowerCase().includes(query));
      
      let childMatches = false;
      const filteredChildren: any[] = [];
      
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          if (checkNode(child)) {
            childMatches = true;
            filteredChildren.push(child);
          }
        });
      }
      
      node.filteredChildren = filteredChildren;
      
      if (nameMatches || childMatches) {
        if (childMatches) {
          autoExpandList.add(node.id);
        }
        return true;
      }
      
      return false;
    };

    const filtered = roots.filter(node => checkNode(node));

    // Auto expand parent categories of matching child categories
    if (autoExpandList.size > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        autoExpandList.forEach(id => next.add(id));
        return next;
      });
    }

    return { filteredTree: filtered, totalRootCount: filtered.length };
  }, [initialCategories, searchTerm]);

  // Paginate only root categories
  const paginatedRoots = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize;
    return filteredTree.slice(from, to);
  }, [filteredTree, currentPage, pageSize]);

  const totalPages = Math.ceil(totalRootCount / pageSize);

  // Render rows recursively
  const renderRow = (node: any, depth: number = 0): React.ReactNode[] => {
    // If we have search term, use filteredChildren, else children
    const childrenList = searchTerm.trim() ? node.filteredChildren : node.children;
    const hasChildren = childrenList && childrenList.length > 0;
    const isExpanded = expandedIds.has(node.id);
    
    const rows: React.ReactNode[] = [];
    
    rows.push(
      <tr key={node.id} className="hover:bg-background/30 transition-all group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasChildren ? (
                <button 
                  onClick={() => toggleExpand(node.id)}
                  className="p-1 hover:bg-background rounded text-text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
              ) : (
                <div className="w-6" /> // spacer
              )}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary transition-all">
                <Tags className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </div>
            </div>
            <span className="font-bold text-foreground">{node.name}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono font-bold text-primary uppercase">{node.code || "-"}</span>
        </td>
        <td className="px-6 py-4 text-text-muted font-medium">{node.description || "-"}</td>
        <td className="px-6 py-4 text-center">
          <CategoryItemsModal 
            categoryId={node.id} 
            categoryName={node.name}
            totalItems={getCumulativeItemCount(node.id)}
          />
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Link 
              href={`/categories/${node.id}/edit`}
              className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </Link>
            <DeleteButton id={node.id} label={`kategori "${node.name}"`} onDelete={deleteCategory} />
          </div>
        </td>
      </tr>
    );
    
    if (isExpanded && hasChildren) {
      childrenList.forEach((child: any) => {
        rows.push(...renderRow(child, depth + 1));
      });
    }
    
    return rows;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Barang</h1>
          <p className="text-text-muted mt-1">Gunakan kategori untuk merapikan inventaris IT Anda.</p>
        </div>
        <Link href="/categories/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Tambah Kategori
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          
          {/* Client-side Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">Halaman {currentPage} dari {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded hover:bg-surface border border-border transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &lt;
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded hover:bg-surface border border-border transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold w-1/3">Nama Kategori</th>
                <th className="px-6 py-4 font-bold w-32">Kode</th>
                <th className="px-6 py-4 font-bold">Deskripsi</th>
                <th className="px-6 py-4 font-bold w-36 text-center">Jumlah Barang</th>
                <th className="px-6 py-4 font-bold text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRoots.length > 0 ? (
                paginatedRoots.map(node => renderRow(node))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Tidak ada data ditemukan</p>
                      <p className="text-sm opacity-50 mt-1">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-muted bg-surface/50 uppercase tracking-widest">
          <p>Total <span className="text-primary font-bold">{initialCategories.length}</span> kategori ditemukan</p>
        </div>
      </div>
    </div>
  );
}
