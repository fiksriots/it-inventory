import { Settings, Building2, User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      icon: Building2,
      title: "Informasi Perusahaan",
      desc: "Nama perusahaan, alamat, dan logo yang muncul di dokumen.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: User,
      title: "Profil & Akun",
      desc: "Ubah nama, email, atau password akun Anda.",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: Bell,
      title: "Notifikasi",
      desc: "Atur kapan dan bagaimana Anda ingin menerima pemberitahuan.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Shield,
      title: "Keamanan & Akses",
      desc: "Kelola peran pengguna dan hak akses untuk setiap anggota tim.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-text-muted mt-1">Kelola preferensi dan konfigurasi sistem inventaris Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-text-muted mt-1">{s.desc}</p>
              <span className="inline-block mt-3 text-xs text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">
                Segera hadir
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
