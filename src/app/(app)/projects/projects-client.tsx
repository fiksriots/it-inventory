"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Plus, Search, FolderKanban, CheckCircle2, AlertTriangle, XCircle, 
  Clock, Calendar, FileText, Loader2, Edit, Trash2, Copy, Check 
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { createProject, updateProject, deleteProject } from "./actions";

interface ProjectsClientProps {
  initialProjects: any[];
  dbTableMissing: boolean;
}

export default function ProjectsClient({ initialProjects, dbTableMissing }: ProjectsClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [sqlCopied, setSqlCopied] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [progressPercent, setProgressPercent] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const sqlCode = `-- Jalankan SQL ini di Supabase SQL Editor Anda:

CREATE TABLE IF NOT EXISTS public.it_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.it_project_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.it_projects(id) ON DELETE CASCADE,
    log_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    content TEXT NOT NULL,
    progress_percent_after INTEGER NOT NULL CHECK (progress_percent_after >= 0 AND progress_percent_after <= 100),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.it_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_project_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select projects" ON public.it_projects FOR SELECT USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can insert projects" ON public.it_projects FOR INSERT WITH CHECK (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can update projects" ON public.it_projects FOR UPDATE USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can delete projects" ON public.it_projects FOR DELETE USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can select project logs" ON public.it_project_logs FOR SELECT USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can insert project logs" ON public.it_project_logs FOR INSERT WITH CHECK (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can update project logs" ON public.it_project_logs FOR UPDATE USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can delete project logs" ON public.it_project_logs FOR DELETE USING (((SELECT auth.role()) = 'authenticated'));`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setSqlCopied(true);
    toast("SQL berhasil disalin!", "success");
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const openCreateModal = () => {
    setName("");
    setDescription("");
    setStatus("Planning");
    setProgressPercent(0);
    setStartDate("");
    setTargetDate("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setStatus(project.status);
    setProgressPercent(project.progress_percent);
    setStartDate(project.start_date || "");
    setTargetDate(project.target_date || "");
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast("Nama project wajib diisi!", "error");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("status", status);
      formData.append("progress_percent", String(progressPercent));
      formData.append("start_date", startDate);
      formData.append("target_date", targetDate);

      const res = await createProject(null, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Project baru berhasil dibuat!", "success");
        setIsCreateModalOpen(false);
        // Refresh local state or let router trigger it
        if (res.project) {
          setProjects([res.project, ...projects]);
        }
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast("Nama project wajib diisi!", "error");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("status", status);
      formData.append("progress_percent", String(progressPercent));
      formData.append("start_date", startDate);
      formData.append("target_date", targetDate);

      const res = await updateProject(editingProject.id, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Project berhasil diperbarui!", "success");
        setIsEditModalOpen(false);
        // Update local state
        setProjects(projects.map(p => p.id === editingProject.id ? { 
          ...p, name, description, status, progress_percent: progressPercent, start_date: startDate, target_date: targetDate, updated_at: new Date().toISOString()
        } : p));
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus project "${name}"? Semua log riwayat & dokumentasi terkait akan terhapus permanen.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProject(id);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Project berhasil dihapus!", "success");
        setProjects(projects.filter(p => p.id !== id));
      }
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Semua" || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === "In Progress").length;
  const completedCount = projects.filter(p => p.status === "Completed").length;
  const planningCount = projects.filter(p => p.status === "Planning" || p.status === "On Hold").length;

  if (dbTableMissing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-foreground">Database Project Planning Belum Diinisialisasi</h2>
          <p className="text-sm text-text-muted max-w-lg">
            Tabel basis data `it_projects` dan `it_project_logs` belum terdeteksi. Silakan salin script SQL di bawah ini dan jalankan di **Supabase SQL Editor** Anda untuk mengaktifkan fitur ini.
          </p>

          <div className="w-full relative bg-[#0d1117] border border-border/60 rounded-xl overflow-hidden mt-2">
            <div className="flex justify-between items-center px-4 py-2 border-b border-border/40 bg-surface/50">
              <span className="text-xs text-text-muted font-mono font-semibold">20260517130000_create_project_planning.sql</span>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FolderKanban className="w-7 h-7" />
            </div>
            Project Planning & Tracking
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Visualisasikan timeline project, catat riwayat pengerjaan berkala, dan unggah foto dokumentasi project IT Anda.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Project Baru
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Project</p>
            <p className="text-2xl font-black text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-blue-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Sedang Berjalan</p>
            <p className="text-2xl font-black text-blue-500">{inProgressCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Selesai</p>
            <p className="text-2xl font-black text-emerald-500">{completedCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Perencanaan</p>
            <p className="text-2xl font-black text-amber-500">{planningCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["Semua", "Planning", "In Progress", "On Hold", "Completed"].map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => setSelectedStatus(statusOption)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                selectedStatus === statusOption
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "bg-surface border border-border/50 text-text-muted hover:text-foreground hover:bg-background"
              }`}
            >
              {statusOption === "Semua" ? "Semua Status" : statusOption}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Cari nama atau deskripsi project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border/40">
          <FolderKanban className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <p className="text-text-muted text-sm font-semibold">Tidak ada project yang ditemukan.</p>
          <p className="text-xs text-text-muted/65 mt-1">Gunakan tombol "Project Baru" untuk menambahkan perencanaan project baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isCompleted = project.status === "Completed";
            const isOverdue = project.status === "In Progress" && project.target_date && new Date(project.target_date) < new Date();

            return (
              <div 
                key={project.id} 
                className="bg-surface border border-border hover:border-primary/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Card Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase whitespace-nowrap tracking-wider ${
                      project.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      project.status === "In Progress" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                      project.status === "On Hold" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-muted/80 line-clamp-2 leading-relaxed h-8">
                    {project.description || "Tidak ada deskripsi project."}
                  </p>

                  {/* Progress Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-text-muted">Progres Pengerjaan</span>
                      <span className={isCompleted ? "text-emerald-500" : "text-primary"}>
                        {project.progress_percent}%
                      </span>
                    </div>
                    <div className="w-full bg-background border border-border/40 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${project.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget RAB Section */}
                  <div className="flex items-center justify-between text-[11px] font-bold pt-2.5 border-t border-border/30">
                    <span className="text-text-muted">Total Anggaran (RAB)</span>
                    <span className="text-foreground font-black text-xs">
                      {formatRupiah(project.it_project_rab?.reduce((sum: number, item: any) => sum + (item.quantity * item.price_per_unit), 0) || 0)}
                    </span>
                  </div>

                  {/* Date Indicators */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40 text-[11px] font-bold text-text-muted/80">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted/50 mb-0.5">Mulai Kerja</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-text-muted/60" />
                        <span>{formatDate(project.start_date)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted/50 mb-0.5">Target Selesai</p>
                      <div className="flex items-center gap-1">
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500 animate-pulse" : "text-text-muted/60"}`} />
                        <span className={isOverdue ? "text-rose-500 font-extrabold" : ""}>
                          {formatDate(project.target_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/40">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-background hover:bg-surface border border-border hover:border-primary/40 rounded-xl text-xs font-bold text-text-muted hover:text-primary transition-all active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Detail & Riwayat
                  </Link>

                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 bg-background hover:bg-primary/10 border border-border hover:border-primary/20 rounded-xl text-text-muted hover:text-primary transition-all active:scale-95"
                    title="Edit Setelan Project"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-2 bg-background hover:bg-rose-500/10 border border-border hover:border-rose-500/20 rounded-xl text-text-muted hover:text-rose-500 transition-all active:scale-95"
                    title="Hapus Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Project */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary" />
                Registrasi Project Baru
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nama Project <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Misal: Upgrade Backbone Core Switch Gedung A"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Deskripsi Project</label>
                <textarea
                  placeholder="Jelaskan ruang lingkup project, target, dan estimasi pengerjaan..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status Awal</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Progres Awal ({progressPercent}%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(parseInt(e.target.value || "0"))}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Target Selesai</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-background border border-border text-text-muted font-bold rounded-xl text-sm transition-all hover:bg-surface active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-md shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Buat Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Setelan Project
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nama Project <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Deskripsi Project</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Progres ({progressPercent}%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(parseInt(e.target.value || "0"))}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Target Selesai</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-background border border-border text-text-muted font-bold rounded-xl text-sm transition-all hover:bg-surface active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-md shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
