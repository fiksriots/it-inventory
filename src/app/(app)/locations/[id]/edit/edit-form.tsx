"use client";

import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";
import { updateLocation } from "../../actions";

export default function EditLocationForm({ location, locations }: { location: any; locations: any[] }) {
  const updateLocationWithId = updateLocation.bind(null, location.id);
  const [state, formAction, isPending] = useActionState(updateLocationWithId, null);

  const formattedLocations = useMemo(() => {
    const map: Record<string, any> = {};
    locations.forEach(loc => {
      map[loc.id] = { ...loc };
    });

    const getPath = (id: string): string => {
      const path: string[] = [];
      let curr = map[id];
      while (curr) {
        path.unshift(curr.name);
        curr = curr.parent_id ? map[curr.parent_id] : null;
      }
      return path.join(" › ");
    };

    return locations.map(loc => ({
      id: loc.id,
      pathName: getPath(loc.id)
    })).sort((a, b) => a.pathName.localeCompare(b.pathName));
  }, [locations]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/locations" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Lokasi</h1>
          <p className="text-text-muted mt-1">Perbarui data departemen atau lokasi penempatan barang.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium">
              {state.error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Departemen / Lokasi <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="name"
                defaultValue={location.name}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Contoh: Lantai 2 - Ruang IT" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lokasi Induk (Parent Location)</label>
              <select
                name="parent_id"
                defaultValue={location.parent_id || ""}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
              >
                <option value="">-- Tanpa Lokasi Induk (Top Level) --</option>
                {formattedLocations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.pathName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alamat / Detail Lokasi</label>
              <textarea 
                name="address"
                defaultValue={location.address}
                rows={4} 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Keterangan mengenai lokasi ini..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/locations" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              Batal
            </Link>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isPending ? "Memperbarui..." : "Perbarui Lokasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
