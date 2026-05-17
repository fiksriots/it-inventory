import SchedulesClient from "./schedules-client";

export const metadata = {
  title: "Jadwal Kerja Tim IT - IT Inventory",
  description: "Kelola jadwal kerja, cuti, dispensasi (DP), dan hari libur nasional (PH) tim IT secara realtime.",
};

export default function SchedulesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <SchedulesClient />
    </div>
  );
}
