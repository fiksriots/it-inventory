"use client";

import { useState } from "react";
import { User, Building2, Bell, Shield, Save, Upload, Loader2, Mail, Phone, MapPin, Key, History, Smartphone, Lock, AlertTriangle, Eye, EyeOff, Users, UserPlus, Trash2, Database, Download } from "lucide-react";
import { updateCompanyProfile, uploadCompanyLogo, changePassword, uploadProfilePhoto, updateProfileName, updateNotificationSettings, addUserAccount, updateUserRole, deleteUserAccount, generateDatabaseBackup } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  user: any;
  userProfile?: any;
  company: any;
  logs?: any[];
  usersList?: any[];
}

export default function SettingsClient({ user, userProfile, company, logs = [], usersList = [] }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile"); // Switched default to profile since we are working on it
  const [loading, setLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      toast("Sedang mengumpulkan data database...", "success");
      const result = await generateDatabaseBackup();
      
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      
      if (result.data) {
        const jsonStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Backup_Database_InventoryIT_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast("Backup berhasil diunduh!", "success");
      }
    } catch (err: any) {
      toast("Gagal melakukan backup database.", "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await addUserAccount(null, formData);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Pengguna berhasil didaftarkan!", "success");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || "Gagal mendaftarkan pengguna", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const result = await updateUserRole(userId, newRole);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Hak akses berhasil diperbarui!", "success");
        router.refresh();
      }
    } catch (err: any) {
      toast("Gagal memperbarui hak akses", "error");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menonaktifkan/menghapus akses pengguna ${userName}?`)) return;
    try {
      const result = await deleteUserAccount(userId);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Akses pengguna berhasil diperbarui/dihapus.", "success");
        router.refresh();
      }
    } catch (err: any) {
      toast("Gagal menghapus pengguna", "error");
    }
  };

  const handleCompanyUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateCompanyProfile(formData);
      toast("Profil perusahaan berhasil diperbarui!", "success");
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui profil", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let finalFile = file;
      if (file.type.startsWith("image/")) {
        
      }
      const formData = new FormData();
      formData.append("logo", finalFile);
      await uploadCompanyLogo(formData);
      toast("Logo berhasil diunggah!", "success");
    } catch (error: any) {
      toast(error.message || "Gagal mengunggah logo", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let finalFile = file;
      if (file.type.startsWith("image/")) {
        
      }
      const formData = new FormData();
      formData.append("avatar", finalFile);
      await uploadProfilePhoto(formData);
      toast("Foto profil berhasil diunggah!", "success");
    } catch (error: any) {
      toast(error.message || "Gagal mengunggah foto profil", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateProfileName(formData);
      toast("Nama berhasil diperbarui!", "success");
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui nama", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateNotificationSettings(formData);
      toast("Pengaturan notifikasi berhasil diperbarui!", "success");
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui notifikasi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await changePassword(formData);
      toast("Password berhasil diperbarui!", "success");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui password", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profil Akun", icon: User },
    { id: "company", label: "Informasi Perusahaan", icon: Building2 },
    { id: "users", label: "Manajemen Pengguna", icon: Users },
    { id: "notifications", label: "Notifikasi", icon: Bell },
    { id: "security", label: "Keamanan", icon: Shield },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Tabs */}
      <div className="lg:col-span-1 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="lg:col-span-3">
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === "company" && (
            <form onSubmit={handleCompanyUpdate}>
              <div className="px-8 py-6 border-b border-border">
                <h2 className="text-lg font-bold">Informasi Perusahaan</h2>
                <p className="text-sm text-text-muted">Atur identitas perusahaan yang akan muncul di sistem dan dokumen.</p>
              </div>
              
              <div className="p-8 space-y-6">
                {/* Logo Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-background border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                      {company?.logo_url ? (
                        <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="w-10 h-10 text-text-muted opacity-20" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-lg shadow-lg cursor-pointer hover:bg-primary-hover transition-colors">
                      <Upload className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={loading} />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Logo Perusahaan</h4>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">Gunakan format PNG atau JPG, disarankan ukuran kotak (1:1) dengan latar belakang transparan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nama Sistem / Perusahaan</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <input
                        type="text"
                        name="name"
                        defaultValue={company?.name}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Bisnis</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <input
                        type="email"
                        name="email"
                        defaultValue={company?.email}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Telepon</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <input
                        type="text"
                        name="phone"
                        defaultValue={company?.phone}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <textarea
                        name="address"
                        defaultValue={company?.address}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-background/50 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h2 className="text-xl font-black text-foreground">Profil Akun Anda</h2>
                  <p className="text-sm text-text-muted mt-1">Informasi personal dan detail akses sistem Anda.</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block shadow-inner">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column - Avatar & Core Info */}
                  <div className="flex flex-col items-center md:items-start space-y-4 md:w-1/3">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-xl shadow-primary/20 text-white border-4 border-surface overflow-hidden">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-5xl font-black tracking-tighter">{user?.email?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <label className="absolute -bottom-3 -right-3 p-3 bg-foreground text-background rounded-xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                      </label>
                    </div>
                    <div className="text-center md:text-left w-full mt-2">
                      <h3 className="text-2xl font-black text-foreground truncate" title={userProfile?.full_name || user?.email?.split('@')[0]}>
                        {userProfile?.full_name || user?.email?.split('@')[0]}
                      </h3>
                      <p className="text-sm font-medium text-text-muted truncate">{user?.email}</p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Detailed Stats */}
                  <div className="flex-1 space-y-6">
                    <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
                      <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2 pb-3 border-b border-border/50">
                        <Key className="w-4 h-4" />
                        Informasi Kredensial & Akses
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">User ID Unik</p>
                          <p className="font-mono text-xs font-bold text-foreground bg-surface p-2 rounded-lg border border-border truncate" title={user?.id}>
                            {user?.id}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Status Verifikasi</p>
                          <p className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Terverifikasi Aktif
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Terdaftar Sejak</p>
                          <p className="font-bold text-sm text-foreground">
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Login Terakhir</p>
                          <p className="font-bold text-sm text-foreground">
                            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile Section */}
                    <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
                      <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2 pb-3 border-b border-border/50">
                        <User className="w-4 h-4" />
                        Edit Profil
                      </h4>
                      <form onSubmit={handleNameUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-text-muted uppercase">Nama Lengkap / Username</label>
                          <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                            <input
                              type="text"
                              name="full_name"
                              defaultValue={userProfile?.full_name || ""}
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              placeholder="Masukkan nama Anda..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 text-xs shadow-md shadow-primary/20"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Nama
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {/* Security Shortcut */}
                    <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-amber-600 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Keamanan Akun
                        </h4>
                        <p className="text-xs text-amber-600/70 mt-1 max-w-sm">Perbarui kata sandi Anda secara rutin untuk meminimalisir risiko akses tidak sah ke sistem inventaris.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab("security")}
                        className="px-5 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 flex items-center gap-2"
                      >
                        Ganti Password
                        <Key className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Password Section */}
              <div className="p-8 border-b border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Ganti Password</h3>
                    <p className="text-sm text-text-muted">Ubah kata sandi Anda secara berkala untuk keamanan.</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Password Baru</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="new_password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-text-muted hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirm_password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-bold hover:bg-foreground/90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Perbarui Password
                  </button>
                </form>
              </div>

              {/* Activity Audit Log */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Log Audit Keamanan</h3>
                    <p className="text-sm text-text-muted">Riwayat aktivitas inventaris terbaru untuk pengawasan.</p>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-background/30">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-background text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <tr>
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-4 py-3">Barang</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Aktivitas</th>
                        <th className="px-4 py-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-background/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString("id-ID", { 
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                              })}
                            </td>
                            <td className="px-4 py-3 font-bold truncate max-w-[150px]">{log.items?.name || "N/A"}</td>
                            <td className="px-4 py-3 text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold">{log.profiles?.full_name || log.profiles?.email?.split('@')[0] || "Sistem"}</span>
                                <span className="text-[9px] text-text-muted">{log.profiles?.email || "Auto-Generated"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                log.mutation_type === 'INBOUND' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>
                                {log.mutation_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-right">{log.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-text-muted italic">Belum ada aktivitas yang tercatat.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Backup */}
              <div className="p-8 mx-8 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-emerald-600 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Backup Keseluruhan Data
                  </h4>
                  <p className="text-xs text-emerald-600/70 mt-1 max-w-sm">Unduh seluruh riwayat data inventaris, pengguna, dan transaksi dalam format JSON sebagai cadangan yang aman.</p>
                </div>
                <button 
                  onClick={handleDownloadBackup}
                  disabled={isBackingUp}
                  className="px-5 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses Data...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Unduh Backup (JSON)
                    </>
                  )}
                </button>
              </div>

              {/* Danger Zone Placeholder */}
              <div className="p-8 m-8 border border-rose-500/20 bg-rose-500/5 rounded-2xl">
                <h4 className="text-rose-500 font-bold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Zona Bahaya
                </h4>
                <p className="text-xs text-text-muted mb-4">Hapus seluruh data inventaris dan reset sistem. Tindakan ini tidak dapat dibatalkan.</p>
                <button className="text-xs font-bold text-rose-500 border border-rose-500/30 px-4 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                  Reset Sistem
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
                <div>
                  <h2 className="text-xl font-black text-foreground">Pengaturan Notifikasi</h2>
                  <p className="text-sm text-text-muted mt-1">Kelola bagaimana sistem memberi tahu Anda tentang aktivitas penting.</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 hidden sm:block shadow-inner">
                  <Bell className="w-6 h-6" />
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleNotificationUpdate} className="space-y-8">
                  {/* Alert Section */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-500 text-white rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-600">Peringatan Stok Rendah</h4>
                        <p className="text-sm text-blue-600/70 mt-1">Sistem akan menandai barang dengan warna merah jika stok berada di bawah angka ini.</p>
                        
                        <div className="mt-6 flex items-center gap-4">
                          <div className="w-24">
                            <label className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest block mb-1">Ambang Batas</label>
                            <input
                              type="number"
                              name="low_stock_threshold"
                              defaultValue={company?.low_stock_threshold || 5}
                              min="0"
                              className="w-full px-4 py-2.5 bg-background border border-blue-500/20 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                            />
                          </div>
                          <div className="flex-1 text-sm text-blue-600/60 font-medium pt-4">
                            Item akan dianggap "Kritis" jika stok ≤ {company?.low_stock_threshold || 5} unit.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Section */}
                  <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-surface rounded-xl border border-border">
                          <Smartphone className="w-6 h-6 text-text-muted" />
                        </div>
                        <div>
                          <h4 className="font-bold">Notifikasi Sistem</h4>
                          <p className="text-sm text-text-muted">Aktifkan peringatan visual di dashboard dan navigasi.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="enable_notifications"
                          defaultChecked={company?.enable_notifications ?? true}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Simpan Konfigurasi Notifikasi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h2 className="text-xl font-black text-foreground">Manajemen Akun & Hak Akses</h2>
                  <p className="text-sm text-text-muted mt-1">Daftarkan akun staf baru dan kelola tingkatan akses tim inventaris.</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Form Tambah Pengguna */}
              <div className="p-8 border-b border-border bg-background/30">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Registrasi Pengguna Baru
                </h3>

                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Nama Lengkap</label>
                    <input 
                      type="text" 
                      name="full_name" 
                      required 
                      placeholder="Nama lengkap staf..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Alamat Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="email@perusahaan.com"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Tingkat Hak Akses (Role)</label>
                    <select 
                      name="role"
                      defaultValue="Staff"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary"
                    >
                      <option value="Administrator">Administrator (Akses Penuh)</option>
                      <option value="Staff">Staff (Transaksi & Master Data)</option>
                      <option value="Viewer">Viewer (Hanya Lihat Data)</option>
                      <option value="Nonaktif">Nonaktif (Akses Diblokir)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Password Awal</label>
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      placeholder="Minimal 6 karakter..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Daftarkan Akun
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Pengguna Aktif */}
              <div className="p-8">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Daftar Tim Terdaftar ({usersList.length})</span>
                </h3>

                <div className="border border-border rounded-xl overflow-hidden bg-surface">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-background/80 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Pengguna</th>
                        <th className="px-4 py-3 w-48">Hak Akses</th>
                        <th className="px-4 py-3 w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-background/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs overflow-hidden shrink-0">
                                {usr.avatar_url ? (
                                  <img src={usr.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  usr.full_name?.charAt(0).toUpperCase() || usr.email?.charAt(0).toUpperCase() || "?"
                                )}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-foreground truncate">{usr.full_name || "Tanpa Nama"}</p>
                                <p className="text-xs text-text-muted truncate">{usr.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={usr.role || "Staff"}
                              onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-none transition-all cursor-pointer ${
                                usr.role === 'Administrator' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                usr.role === 'Viewer' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                usr.role === 'Nonaktif' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-primary/10 text-primary border-primary/20'
                              }`}
                            >
                              <option value="Administrator" className="bg-surface text-foreground">Administrator</option>
                              <option value="Staff" className="bg-surface text-foreground">Staff</option>
                              <option value="Viewer" className="bg-surface text-foreground">Viewer</option>
                              <option value="Nonaktif" className="bg-surface text-rose-500">Nonaktif</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleDeleteUser(usr.id, usr.full_name || usr.email)}
                              className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Hapus / Nonaktifkan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
