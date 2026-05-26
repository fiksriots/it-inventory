"use client";

import { useState, useTransition, useMemo, useCallback, Fragment } from "react";
import { Plus, MapPin, Edit, ShoppingCart, Monitor, Cctv, ChevronRight, ChevronDown, CornerDownRight, Search } from "lucide-react";
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

interface LocationNode extends Location {
  children: LocationNode[];
  cumulativeItems: number;
  cumulativeComputers: number;
  cumulativeInfra: number;
}

interface LocationsClientProps {
  initialLocations: Location[];
}

export default function LocationsClient({ initialLocations }: LocationsClientProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Membangun pohon lokasi dan menghitung statistik kumulatif
  const { roots, nodesMap } = useMemo(() => {
    const map: Record<string, LocationNode> = {};
    
    locations.forEach((loc) => {
      map[loc.id] = {
        ...loc,
        children: [],
        cumulativeItems: 0,
        cumulativeComputers: 0,
        cumulativeInfra: 0,
      };
    });

    const rootList: LocationNode[] = [];
    locations.forEach((loc) => {
      const node = map[loc.id];
      if (loc.parent_id && map[loc.parent_id]) {
        map[loc.parent_id].children.push(node);
      } else {
        rootList.push(node);
      }
    });

    // Urutkan sub-lokasi berdasarkan nama secara rekursif
    const sortNode = (node: LocationNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortNode);
    };
    rootList.sort((a, b) => a.name.localeCompare(b.name));
    rootList.forEach(sortNode);

    // Hitung statistik secara rekursif dari bawah ke atas
    const computeStats = (node: LocationNode) => {
      let directItems = node.item_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      let directComputers = node.computers?.length || 0;
      let directInfra = node.infrastructure_assets?.length || 0;

      node.children.forEach((child) => {
        computeStats(child);
        directItems += child.cumulativeItems;
        directComputers += child.cumulativeComputers;
        directInfra += child.cumulativeInfra;
      });

      node.cumulativeItems = directItems;
      node.cumulativeComputers = directComputers;
      node.cumulativeInfra = directInfra;
    };
    rootList.forEach(computeStats);

    return { roots: rootList, nodesMap: map };
  }, [locations]);

  // Fungsi pencocokan pencarian secara rekursif
  const matchesSearch = useCallback((node: LocationNode, query: string): boolean => {
    const matchesSelf =
      node.name.toLowerCase().includes(query) ||
      (node.address && node.address.toLowerCase().includes(query));
    if (matchesSelf) return true;
    return node.children.some((child) => matchesSearch(child, query));
  }, []);

  // Ekspansi otomatis untuk hasil pencarian
  const searchExpandedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!searchQuery) return map;

    const query = searchQuery.toLowerCase();
    const buildSearchExpanded = (nodes: LocationNode[]) => {
      nodes.forEach((node) => {
        const hasMatchingDescendant = node.children.some((child) => matchesSearch(child, query));
        if (hasMatchingDescendant) {
          map[node.id] = true;
        }
        buildSearchExpanded(node.children);
      });
    };
    buildSearchExpanded(roots);
    return map;
  }, [roots, searchQuery, matchesSearch]);

  const activeExpandedMap = useMemo(() => {
    return { ...expandedLocations, ...searchExpandedMap };
  }, [expandedLocations, searchExpandedMap]);

  const toggleLocation = (id: string) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Meratakan pohon ke baris tabel (Flattened)
  const flattenedRows = useMemo(() => {
    interface FlattenedRow {
      node: LocationNode;
      depth: number;
      hasChildren: boolean;
      isExpanded: boolean;
    }
    const list: FlattenedRow[] = [];
    const query = searchQuery.toLowerCase();

    const flatten = (nodes: LocationNode[], depth: number = 0) => {
      const filtered = searchQuery
        ? nodes.filter((node) => matchesSearch(node, query))
        : nodes;

      filtered.forEach((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = !!activeExpandedMap[node.id];

        list.push({
          node,
          depth,
          hasChildren,
          isExpanded,
        });

        if (hasChildren && isExpanded) {
          flatten(node.children, depth + 1);
        }
      });
    };

    flatten(roots);
    return list;
  }, [roots, searchQuery, activeExpandedMap, matchesSearch]);

  // Fungsi untuk mendapatkan path lengkap dari lokasi (breadcrumb)
  const getLocationPath = useCallback((nodeId: string): string => {
    const path: string[] = [];
    let currentId: string | null = nodeId;
    while (currentId) {
      const pathNode: LocationNode | undefined = nodesMap[currentId];
      if (pathNode) {
        path.unshift(pathNode.name);
        currentId = pathNode.parent_id;
      } else {
        break;
      }
    }
    return path.join(" › ");
  }, [nodesMap]);

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
          <p className="text-text-muted mt-1">Kelola daftar departemen, lokasi utama, dan sub-lokasi penempatan barang secara bertingkat.</p>
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
              placeholder="Cari lokasi utama, sub-lokasi, atau lantai..."
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
              {flattenedRows.length > 0 ? (
                flattenedRows.map(({ node, depth, hasChildren, isExpanded }) => {
                  const directItems = node.item_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                  const hasSubStocks = node.cumulativeItems > directItems;

                  return (
                    <tr 
                      key={node.id} 
                      className={`hover:bg-background/40 transition-all ${
                        depth === 0 
                          ? "border-b border-border/60 font-semibold" 
                          : "bg-surface/10 border-b border-border/40"
                      }`}
                    >
                      <td className="px-6 py-4" style={{ paddingLeft: `${24 + depth * 24}px` }}>
                        <div className="flex items-center gap-3">
                          {/* Toggle Ekspansi */}
                          {hasChildren ? (
                            <button
                              onClick={() => toggleLocation(node.id)}
                              className="p-1 hover:bg-border/60 rounded-md transition-colors text-text-muted hover:text-foreground cursor-pointer shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}

                          <div 
                            className={`flex items-center gap-2.5 ${hasChildren ? "cursor-pointer select-none" : ""}`}
                            onClick={() => hasChildren && toggleLocation(node.id)}
                          >
                            {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-text-muted/60 shrink-0" />}
                            <div className={
                              depth === 0 
                                ? "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0" 
                                : "w-7 h-7 rounded-lg bg-border/50 flex items-center justify-center border border-border shrink-0"
                            }>
                              <MapPin className={
                                depth === 0 
                                  ? "w-4.5 h-4.5 text-primary" 
                                  : "w-3.5 h-3.5 text-text-muted"
                              } />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-foreground hover:text-primary transition-colors ${
                                depth === 0 ? "text-sm font-bold" : "text-xs font-semibold"
                              }`}>
                                {node.name}
                              </span>
                              {hasChildren && (
                                <span className="text-[10px] text-text-muted font-medium mt-0.5">
                                  {node.children.length} Sub-lokasi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-medium text-xs">
                        {node.address || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <LocationItemsModal
                          locationId={node.id}
                          locationName={getLocationPath(node.id)}
                          totalItems={node.cumulativeItems}
                          triggerLabel={
                            node.cumulativeItems > 0 ? (
                              <button className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer">
                                {node.cumulativeItems} Unit {hasSubStocks && `(Akumulatif)`}
                              </button>
                            ) : (
                              <span className="text-text-muted/50 text-xs">0 Unit</span>
                            )
                          }
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/computers?location=${node.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary/40 hover:text-primary transition-all font-mono ${
                            depth === 0 ? "text-xs font-bold" : "text-[11px] font-medium"
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5 text-primary" />
                          <span>{node.cumulativeComputers} Unit</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/infrastructure?location=${node.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-blue-500/40 hover:text-blue-500 transition-all font-mono ${
                            depth === 0 ? "text-xs font-bold" : "text-[11px] font-medium"
                          }`}
                        >
                          <Cctv className="w-3.5 h-3.5 text-blue-500" />
                          <span>{node.cumulativeInfra} Unit</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/locations/${node.id}/edit`}
                            className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <DeleteButton id={node.id} label={`lokasi "${node.name}"`} onDelete={handleDeleteLocal} />
                        </div>
                      </td>
                    </tr>
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
