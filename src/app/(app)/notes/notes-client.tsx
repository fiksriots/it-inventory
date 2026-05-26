"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { 
  StickyNote, Pin, Search, Trash2, Edit3, X, Check, Copy, 
  AlertTriangle, Loader2, Palette, Plus, RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { 
  createNote, updateNote, deleteNote, togglePinNote, updateNoteColor 
} from "./actions";

interface NotesClientProps {
  initialNotes: any[];
  dbTableMissing: boolean;
}

const colorClasses: Record<string, { card: string; picker: string; name: string }> = {
  default: {
    card: "bg-surface border-border text-foreground hover:shadow-md",
    picker: "bg-surface border-border hover:bg-background",
    name: "Default"
  },
  red: {
    card: "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/30 text-rose-950 dark:text-rose-100 hover:shadow-md hover:shadow-rose-100/30 dark:hover:shadow-none",
    picker: "bg-rose-400 dark:bg-rose-800 border-rose-400 text-white",
    name: "Merah"
  },
  orange: {
    card: "bg-orange-50/70 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-900/30 text-orange-950 dark:text-orange-100 hover:shadow-md hover:shadow-orange-100/30 dark:hover:shadow-none",
    picker: "bg-orange-400 dark:bg-orange-700 border-orange-400 text-white",
    name: "Jingga"
  },
  yellow: {
    card: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 hover:shadow-md hover:shadow-amber-100/30 dark:hover:shadow-none",
    picker: "bg-amber-400 dark:bg-amber-700 border-amber-400 text-white",
    name: "Kuning"
  },
  green: {
    card: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-100 hover:shadow-md hover:shadow-emerald-100/30 dark:hover:shadow-none",
    picker: "bg-emerald-400 dark:bg-emerald-800 border-emerald-400 text-white",
    name: "Hijau"
  },
  teal: {
    card: "bg-teal-50/70 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-900/30 text-teal-950 dark:text-teal-100 hover:shadow-md hover:shadow-teal-100/30 dark:hover:shadow-none",
    picker: "bg-teal-400 dark:bg-teal-800 border-teal-400 text-white",
    name: "Teal"
  },
  blue: {
    card: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/30 text-blue-950 dark:text-blue-100 hover:shadow-md hover:shadow-blue-100/30 dark:hover:shadow-none",
    picker: "bg-blue-400 dark:bg-blue-800 border-blue-400 text-white",
    name: "Biru"
  },
  purple: {
    card: "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/30 text-purple-950 dark:text-purple-100 hover:shadow-md hover:shadow-purple-100/30 dark:hover:shadow-none",
    picker: "bg-purple-400 dark:bg-purple-800 border-purple-400 text-white",
    name: "Ungu"
  },
  pink: {
    card: "bg-pink-50/70 dark:bg-pink-950/20 border-pink-200/80 dark:border-pink-900/30 text-pink-950 dark:text-pink-100 hover:shadow-md hover:shadow-pink-100/30 dark:hover:shadow-none",
    picker: "bg-pink-400 dark:bg-pink-700 border-pink-400 text-white",
    name: "Merah Muda"
  },
  gray: {
    card: "bg-stone-50/70 dark:bg-stone-900/20 border-stone-200/80 dark:border-stone-800/30 text-stone-950 dark:text-stone-100 hover:shadow-md hover:shadow-stone-100/30 dark:hover:shadow-none",
    picker: "bg-stone-400 dark:bg-stone-700 border-stone-400 text-white",
    name: "Abu-abu"
  }
};

export default function NotesClient({ initialNotes, dbTableMissing }: NotesClientProps) {
  const [notes, setNotes] = useState<any[]>(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorFilter, setSelectedColorFilter] = useState("Semua");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Create Form states
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [isPinned, setIsPinned] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  // Edit states
  const [editingNote, setEditingNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("default");
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [showEditColorPalette, setShowEditColorPalette] = useState(false);

  // Database SQL installation setup
  const [sqlCopied, setSqlCopied] = useState(false);
  const creatorRef = useRef<HTMLDivElement>(null);

  const sqlCode = `-- Jalankan SQL ini di Supabase SQL Editor Anda untuk mengaktifkan tabel Catatan IT:

CREATE TABLE IF NOT EXISTS public.it_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'default',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select notes" ON public.it_notes FOR SELECT USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can insert notes" ON public.it_notes FOR INSERT WITH CHECK (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can update notes" ON public.it_notes FOR UPDATE USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can delete notes" ON public.it_notes FOR DELETE USING (((SELECT auth.role()) = 'authenticated'));`;

  // Click outside listener for note creator collapse
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (creatorRef.current && !creatorRef.current.contains(event.target as Node)) {
        if (!title.trim() && !content.trim()) {
          setIsExpanded(false);
          setShowColorPalette(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [title, content]);

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setSqlCopied(true);
    toast("SQL berhasil disalin!", "success");
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setIsExpanded(false);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("color", color);
      formData.append("is_pinned", isPinned ? "true" : "false");

      const res = await createNote(null, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Catatan berhasil disimpan!", "success");
        if (res.note) {
          setNotes([res.note, ...notes]);
        }
        // Reset states
        setTitle("");
        setContent("");
        setColor("default");
        setIsPinned(false);
        setIsExpanded(false);
        setShowColorPalette(false);
      }
    });
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingNote) return;

    if (!editTitle.trim() && !editContent.trim()) {
      return toast("Judul atau isi catatan wajib diisi!", "error");
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("content", editContent);
      formData.append("color", editColor);
      formData.append("is_pinned", editIsPinned ? "true" : "false");

      const res = await updateNote(editingNote.id, null, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Catatan diperbarui!", "success");
        if (res.note) {
          setNotes(notes.map(n => n.id === editingNote.id ? res.note : n));
        }
        setEditingNote(null);
      }
    });
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    // Instant UI reaction
    setNotes(notes.map(n => n.id === id ? { ...n, is_pinned: !currentPin } : n));

    const res = await togglePinNote(id, !currentPin);
    if (res.error) {
      toast(res.error, "error");
      // rollback UI
      setNotes(notes.map(n => n.id === id ? { ...n, is_pinned: currentPin } : n));
    }
  };

  const handleColorChange = async (id: string, targetColor: string) => {
    // Instant UI reaction
    setNotes(notes.map(n => n.id === id ? { ...n, color: targetColor } : n));

    const res = await updateNoteColor(id, targetColor);
    if (res.error) {
      toast(res.error, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;

    // Instant UI response
    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== id));

    const res = await deleteNote(id);
    if (res.error) {
      toast(res.error, "error");
      setNotes(previousNotes);
    } else {
      toast("Catatan berhasil dihapus!", "success");
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColorFilter === "Semua" || n.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const otherNotes = filteredNotes.filter(n => !n.is_pinned);

  if (dbTableMissing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-foreground">Tabel Catatan IT Belum Diinisialisasi</h2>
          <p className="text-sm text-text-muted max-w-lg">
            Tabel basis data `it_notes` belum terdeteksi. Silakan jalankan script SQL di bawah ini pada **Supabase SQL Editor** untuk mengaktifkan fitur Keep-like notes.
          </p>

          <div className="w-full relative bg-[#0d1117] border border-border/60 rounded-xl overflow-hidden mt-2">
            <div className="flex justify-between items-center px-4 py-2 border-b border-border/40 bg-surface/50">
              <span className="text-xs text-text-muted font-mono font-semibold">20260526113200_create_it_notes.sql</span>
              <button
                onClick={copySql}
                className="flex items-center gap-1.5 px-3 py-1 bg-surface hover:bg-background border border-border/80 rounded-lg text-xs font-bold text-text-muted hover:text-foreground transition-all"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {sqlCopied ? "Disalin!" : "Salin SQL"}
              </button>
            </div>
            <pre className="p-4 text-left text-xs font-mono overflow-x-auto text-emerald-400/90 leading-relaxed max-h-80 overflow-y-auto">
              <code>{sqlCode}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <StickyNote className="w-7 h-7" />
            </div>
            Catatan IT
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Simpan memo, sandi, panduan penanganan cepat, dan pengingat harian secara interaktif layaknya Google Keep.
          </p>
        </div>
      </div>

      {/* Note Creator Container (Google Keep style) */}
      <div className="max-w-xl mx-auto" ref={creatorRef}>
        <div className={`border rounded-xl shadow-sm transition-all duration-300 ${colorClasses[color].card} ${isExpanded ? 'ring-2 ring-primary/20 scale-[1.01]' : ''}`}>
          
          {isExpanded && (
            <div className="px-4 pt-3 flex justify-between items-center">
              <input
                type="text"
                placeholder="Judul"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent font-bold text-sm outline-none border-none placeholder-text-muted/70 text-foreground"
              />
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition-all ${isPinned ? 'text-primary bg-primary/10' : 'text-text-muted hover:bg-background'}`}
                title={isPinned ? "Lepaskan Pin" : "Sematkan Catatan"}
              >
                <Pin className="w-4 h-4 fill-current" />
              </button>
            </div>
          )}

          <div className="px-4 py-3">
            <textarea
              placeholder="Tulis catatan..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              rows={isExpanded ? 3 : 1}
              className="w-full bg-transparent text-xs font-semibold outline-none border-none resize-none placeholder-text-muted/70 text-foreground"
            />
          </div>

          {isExpanded && (
            <div className="px-4 py-2 border-t border-border/30 flex items-center justify-between gap-2 bg-background/5 rounded-b-xl">
              <div className="flex items-center gap-1 relative">
                {/* Palette color selection */}
                <button
                  type="button"
                  onClick={() => setShowColorPalette(!showColorPalette)}
                  className="p-1.5 text-text-muted hover:text-foreground rounded-lg hover:bg-background transition-colors"
                  title="Pilih Warna"
                >
                  <Palette className="w-4.5 h-4.5" />
                </button>
                {showColorPalette && (
                  <div className="absolute left-0 bottom-8 z-30 bg-surface border border-border shadow-xl rounded-xl p-2 flex gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {Object.keys(colorClasses).map((colName) => (
                      <button
                        key={colName}
                        type="button"
                        onClick={() => {
                          setColor(colName);
                          setShowColorPalette(false);
                        }}
                        className={`w-5 h-5 rounded-full border border-border/60 ${colorClasses[colName].picker} hover:scale-110 active:scale-95 transition-all`}
                        title={colorClasses[colName].name}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setContent("");
                    setColor("default");
                    setIsPinned(false);
                    setIsExpanded(false);
                    setShowColorPalette(false);
                  }}
                  className="px-3 py-1.5 hover:bg-background border border-transparent rounded-lg text-xs font-semibold text-text-muted transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateSubmit()}
                  disabled={isPending}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Simpan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Color filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedColorFilter("Semua")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                selectedColorFilter === "Semua"
                  ? "bg-primary text-white shadow-md"
                  : "bg-background border border-border text-text-muted hover:text-foreground"
              }`}
            >
              Semua Warna
            </button>
            {Object.keys(colorClasses).map((colName) => (
              <button
                key={colName}
                onClick={() => setSelectedColorFilter(colName)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedColorFilter === colName
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-background border-border text-text-muted hover:text-foreground"
                }`}
              >
                <span className={`w-3 h-3 rounded-full border border-border/50 ${colorClasses[colName].picker}`} />
                {colorClasses[colName].name}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-xs placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Empty notes view */}
      {filteredNotes.length === 0 && (
        <div className="p-16 text-center rounded-2xl bg-surface border border-border/40 shadow-sm max-w-lg mx-auto">
          <StickyNote className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <p className="text-text-muted text-sm font-semibold">Tidak ada catatan yang ditemukan.</p>
          <p className="text-xs text-text-muted/65 mt-1">Gunakan form di atas untuk membuat catatan atau pengingat IT pertama Anda.</p>
        </div>
      )}

      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest pl-1">DISEMATKAN</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
                onColorChange={handleColorChange}
                onEditClick={(n) => {
                  setEditingNote(n);
                  setEditTitle(n.title || "");
                  setEditContent(n.content || "");
                  setEditColor(n.color || "default");
                  setEditIsPinned(n.is_pinned || false);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others Section */}
      {otherNotes.length > 0 && (
        <div className="space-y-3 pt-4">
          {pinnedNotes.length > 0 && (
            <h2 className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest pl-1">LAINNYA</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
                onColorChange={handleColorChange}
                onEditClick={(n) => {
                  setEditingNote(n);
                  setEditTitle(n.title || "");
                  setEditContent(n.content || "");
                  setEditColor(n.color || "default");
                  setEditIsPinned(n.is_pinned || false);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit Note */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditingNote(null)}>
          <div 
            className={`border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 ${colorClasses[editColor].card}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/20">
              <input
                type="text"
                placeholder="Judul"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent font-extrabold text-sm outline-none border-none text-foreground w-full placeholder-text-muted/70"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditIsPinned(!editIsPinned)}
                  className={`p-1.5 rounded-lg transition-all ${editIsPinned ? 'text-primary bg-primary/10' : 'text-text-muted hover:bg-background/20'}`}
                  title={editIsPinned ? "Lepaskan Pin" : "Sematkan Catatan"}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>
                <button 
                  onClick={() => setEditingNote(null)}
                  className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <textarea
                placeholder="Tulis catatan..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full bg-transparent text-xs font-semibold outline-none border-none resize-none text-foreground placeholder-text-muted/70"
              />
            </div>

            <div className="px-6 py-4 border-t border-border/20 flex items-center justify-between bg-background/5">
              <div className="flex items-center gap-1 relative">
                <button
                  type="button"
                  onClick={() => setShowEditColorPalette(!showEditColorPalette)}
                  className="p-1.5 text-text-muted hover:text-foreground rounded-lg hover:bg-background/20 transition-colors"
                  title="Pilih Warna"
                >
                  <Palette className="w-4.5 h-4.5" />
                </button>
                {showEditColorPalette && (
                  <div className="absolute left-0 bottom-8 z-30 bg-surface border border-border shadow-xl rounded-xl p-2 flex gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {Object.keys(colorClasses).map((colName) => (
                      <button
                        key={colName}
                        type="button"
                        onClick={() => {
                          setEditColor(colName);
                          setShowEditColorPalette(false);
                        }}
                        className={`w-5 h-5 rounded-full border border-border/60 ${colorClasses[colName].picker} hover:scale-110 active:scale-95 transition-all`}
                        title={colorClasses[colName].name}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 hover:bg-background/20 rounded-xl text-xs font-bold text-text-muted transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSubmit()}
                  disabled={isPending}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Card Component inside
function NoteCard({ 
  note, onTogglePin, onColorChange, onEditClick, onDelete 
}: { 
  note: any; 
  onTogglePin: (id: string, currentPin: boolean) => void;
  onColorChange: (id: string, color: string) => void;
  onEditClick: (note: any) => void;
  onDelete: (id: string) => void;
}) {
  const [showCardPalette, setShowCardPalette] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setShowCardPalette(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between min-h-[140px] relative group/card transition-all duration-300 hover:scale-[1.01] ${colorClasses[note.color || 'default'].card}`}>
      
      {/* Pin/Unpin */}
      <button
        type="button"
        onClick={() => onTogglePin(note.id, note.is_pinned)}
        className={`absolute right-3 top-3 p-1 rounded hover:bg-background/20 transition-all opacity-0 group-hover/card:opacity-100 ${note.is_pinned ? 'text-primary opacity-100' : 'text-text-muted/50'}`}
        title={note.is_pinned ? "Lepaskan Pin" : "Sematkan Catatan"}
      >
        <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
      </button>

      {/* Note Content */}
      <div className="space-y-2 cursor-pointer pr-5" onClick={() => onEditClick(note)}>
        {note.title && (
          <h3 className="font-extrabold text-sm leading-tight pr-2 break-words">
            {note.title}
          </h3>
        )}
        <p className="text-[11px] font-semibold leading-relaxed whitespace-pre-wrap break-words opacity-85">
          {note.content}
        </p>
      </div>

      {/* Action Toolbar on Hover */}
      <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 border-t border-border/10 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <div className="relative" ref={paletteRef}>
          <button
            type="button"
            onClick={() => setShowCardPalette(!showCardPalette)}
            className="p-1.5 text-text-muted/60 hover:text-foreground rounded hover:bg-background/20 transition-colors"
            title="Ubah Warna"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          
          {showCardPalette && (
            <div className="absolute right-0 bottom-7 z-20 bg-surface border border-border shadow-xl rounded-xl p-1.5 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {Object.keys(colorClasses).map((colName) => (
                <button
                  key={colName}
                  type="button"
                  onClick={() => {
                    onColorChange(note.id, colName);
                    setShowCardPalette(false);
                  }}
                  className={`w-4 h-4 rounded-full border border-border/50 ${colorClasses[colName].picker} hover:scale-110 active:scale-95 transition-all`}
                  title={colorClasses[colName].name}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEditClick(note)}
          className="p-1.5 text-text-muted/60 hover:text-amber-500 rounded hover:bg-background/20 transition-colors"
          title="Edit Catatan"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="p-1.5 text-text-muted/60 hover:text-rose-500 rounded hover:bg-background/20 transition-colors"
          title="Hapus Catatan"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
