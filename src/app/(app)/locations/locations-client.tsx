"use client";

import { useState, useTransition, useMemo, useEffect, Fragment } from "react";
import { Plus, MapPin, PackageX, Edit, ShoppingCart, Monitor, Cctv, ChevronRight, ChevronDown, CornerDownRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteLocation } from "./actions";
import LocationItemsModal from "./location-items-modal";

interface Location {
  id: string;
  name: string;
  address: string | null;
  parent_id: string | null;
  created_at: string;
  parent?: { name: string } | null;
  item_stocks?: { quantity: number }[];
  computers?: { id: string }[];
  infrastructure_assets?: { id: string }[];
}

interface LocationsClientProps {
  initialLocations: Location[];
}

export default function LocationsClient({ initialLocations }: LocationsClientProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Membagi lokasi menjadi parent (top-level) dan children (sub-lokasi)
  const { parents, childrenByParent } = useMemo(() => {
    const parentList: Location[] = [];
    const childrenMap: Record<string, Location[]> = {};

    locations.forEach((loc) => {
      if (!loc.parent_id) {
        parentList.push(loc);
      } else {
        if (!childrenMap[loc.parent_id]) {
          childrenMap[loc.parent_id] = [];
        }
        childrenMap[loc.parent_id].push(loc);
      }
    });

    // Urutkan berdasarkan nama
    parentList.sort((a, b) => a.name.localeCompare(b.name));
    Object.keys(childrenMap).forEach((parentId) => {
      childrenMap[parentId].sort((a, b) => a.name.localeCompare(b.name));
    });

    return { parents: parentList, childrenByParent: childrenMap };
  }, [locations]);

  // Efek samping: Buka otomatis parent yang memiliki anak yang cocok dengan kata kunci pencarian
  useEffect(() => {
    if (!searchQuery) return;
    
    const nextExpanded: Record<string, boolean> = {};
    parents.forEach((parent) => {
      const children = childrenByParent[parent.id] || [];
      const hasMatchingChild = children.some((child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (child.address && child.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      if (hasMatchingChild) {
        nextExpanded[parent.id] = true;
      }
    });
    
    setExpandedParents((prev) => ({ ...prev, ...nextExpanded }));
  }, [searchQuery, parents, childrenByParent]);

  // Handler toggle ekspansi parent
  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Filter parent berdasarkan pencarian (parent itu sendiri cocok, atau ada anaknya yang cocok)
  const filteredParents = useMemo(() => {
    if (!searchQuery) return parents;

    const query = searchQuery.toLowerCase();
    return parents.filter((parent) => {
      const matchesParent =
        parent.name.toLowerCase().includes(query) ||
        (parent.address && parent.address.toLowerCase().includes(query));

      const children = childrenByParent[parent.id] || [];
      const matchesChild = children.some(
        (child) =>
          child.name.toLowerCase().includes(query) ||
          (child.address && child.address.toLowerCase().includes(query))
      );

      return matchesParent || matchesChild;
    });
  }, [parents, childrenByParent, searchQuery]);

  // Filter children berdasarkan pencarian untuk setiap parent yang ditampilkan
  const getFilteredChildren = (parentId: string) => {
    const children = childrenByParent[parentId] || [];
    if (!searchQuery) return children;

    const query = searchQuery.toLowerCase();
    return children.filter(
      (child) =>
        child.name.toLowerCase().includes(query) ||
        (child.address && child.address.toLowerCase().includes(query))
    );
  };

  // Handler hapus lokasi lokal setelah berhasil dihapus di database
  const handleDeleteLocal = async (id: string) => {
    const result = await deleteLocation(id);
    if (!result?.error) {
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    }
    return result;
  };

  const totalLocationsCount = locations.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departemen & Lokasi</h1>
          <p className="text-text-muted mt-1">Kelola daftar departemen, lokasi utama, dan sub-lokasi penempatan barang.</p>
        </div>
        <Link
          href="/locations/new"
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Tambah Lokasi
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="flex-1 relative w-full">
            <Search className="w-4.5 h-4.5 absolute left-4 top-3 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lokasi utama atau sub-lokasi..."
              className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold w-1/3">Nama Departemen / Lokasi</th>
                <th className="px-6 py-4 font-bold">Alamat / Detail</th>
                <th className="px-6 py-4 font-bold text-center w-32">Total Barang</th>
                <th className="px-6 py-4 font-bold text-center w-32">Komputer</th>
                <th className="px-6 py-4 font-bold text-center w-32">Infrastruktur</th>
                <th className="px-6 py-4 font-bold text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParents.length > 0 ? (
                filteredParents.map((parent) => {
                  const parentChildren = getFilteredChildren(parent.id);
                  const hasChildren = parentChildren.length > 0;
                  const isExpanded = !!expandedParents[parent.id];

                  // Hitung total barang dari parent saja
                  const parentTotalItems = parent.item_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                  
                  // Hitung total akumulatif (parent + semua sub-lokasinya)
                  const subLocationsTotalItems = (childrenByParent[parent.id] || []).reduce((acc, child) => {
                    return acc + (child.item_stocks?.reduce((a, c) => a + c.quantity, 0) || 0);
                  }, 0);
                  const cumulativeTotalItems = parentTotalItems + subLocationsTotalItems;

                  return (
                    <Fragment key={parent.id}>
                      {/* Baris Lokasi Induk (Parent Row) */}
                      <tr className="hover:bg-background/40 transition-all group/parent border-b border-border/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Toggle Ekspansi */}
                            {hasChildren ? (
                              <button
                                onClick={() => toggleParent(parent.id)}
                                className="p-1 hover:bg-border/60 rounded-md transition-colors text-text-muted hover:text-foreground cursor-pointer shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <div className="w-6" /> // Placeholder spacing jika tidak punya sub-lokasi
                            )}

                            <div 
                              className={`flex items-center gap-2.5 ${hasChildren ? "cursor-pointer select-none" : ""}`}
                              onClick={() => hasChildren && toggleParent(parent.id)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover/parent:bg-primary group-hover/parent:border-primary transition-all shrink-0">
                                <MapPin className="w-4.5 h-4.5 text-primary group-hover/parent:text-white transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground group-hover/parent:text-primary transition-colors text-sm">
                                  {parent.name}
                                </span>
                                {hasChildren && (
                                  <span className="text-[10px] text-text-muted font-medium mt-0.5">
                                    {parentChildren.length} Sub-lokasi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-muted font-medium text-xs">
                          {parent.address || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <LocationItemsModal
                            locationId={parent.id}
                            locationName={parent.name}
                            totalItems={cumulativeTotalItems}
                            triggerLabel={
                              cumulativeTotalItems > 0 ? (
                                <button className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer">
                                  {cumulativeTotalItems} Unit {subLocationsTotalItems > 0 && `(Akumulatif)`}
                                </button>
                              ) : (
                                <span className="text-text-muted/50 text-xs">0 Unit</span>
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/computers?location=${parent.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary/40 hover:text-primary transition-all text-xs font-bold font-mono"
                          >
                            <Monitor className="w-3.5 h-3.5 text-primary" />
                            <span>{parent.computers?.length || 0} Unit</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/infrastructure?location=${parent.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-blue-500/40 hover:text-blue-500 transition-all text-xs font-bold font-mono"
                          >
                            <Cctv className="w-3.5 h-3.5 text-blue-500" />
                            <span>{parent.infrastructure_assets?.length || 0} Unit</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/locations/${parent.id}/edit`}
                              className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <DeleteButton id={parent.id} label={`lokasi "${parent.name}"`} onDelete={handleDeleteLocal} />
                          </div>
                        </td>
                      </tr>

                      {/* Baris Sub-lokasi (Children Rows) */}
                      {isExpanded &&
                        parentChildren.map((child) => {
                          const childTotalItems = child.item_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

                          return (
                            <tr
                              key={child.id}
                              className="bg-surface/10 hover:bg-primary/5 transition-all group/child border-b border-border/40"
                            >
                              <td className="px-6 py-3 pl-12">
                                <div className="flex items-center gap-2.5">
                                  {/* Ikon Alur Pohon */}
                                  <CornerDownRight className="w-4 h-4 text-text-muted/60 shrink-0" />
                                  <div className="w-7 h-7 rounded-lg bg-border/50 flex items-center justify-center border border-border shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-text-muted group-hover/child:text-primary transition-colors" />
                                  </div>
                                  <span className="font-semibold text-text-muted group-hover/child:text-foreground transition-colors text-xs">
                                    {child.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-text-muted font-medium text-xs opacity-80">
                                {child.address || "-"}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <LocationItemsModal
                                  locationId={child.id}
                                  locationName={`${parent.name} › ${child.name}`}
                                  totalItems={childTotalItems}
                                />
                              </td>
                              <td className="px-6 py-3 text-center">
                                <Link
                                  href={`/computers?location=${child.id}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border/80 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-medium font-mono"
                                >
                                  <Monitor className="w-3 h-3 text-primary" />
                                  <span>{child.computers?.length || 0} Unit</span>
                                </Link>
                              </td>
                              <td className="px-6 py-3 text-center">
                                <Link
                                  href={`/infrastructure?location=${child.id}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border/80 hover:border-blue-500/40 hover:text-blue-500 transition-all text-[11px] font-medium font-mono"
                                >
                                  <Cctv className="w-3 h-3 text-blue-500" />
                                  <span>{child.infrastructure_assets?.length || 0} Unit</span>
                                </Link>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={`/locations/${child.id}/edit`}
                                    className="p-1 text-text-muted hover:text-primary rounded hover:bg-primary/10 transition-all"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Link>
                                  <DeleteButton id={child.id} label={`sub-lokasi "${child.name}"`} onDelete={handleDeleteLocal} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-text-muted bg-background/20">
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
          <p>Total <span className="text-primary font-bold">{totalLocationsCount}</span> lokasi terdaftar di sistem</p>
        </div>
      </div>
    </div>
  );
}
