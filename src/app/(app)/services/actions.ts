"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function createService(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const itemId = formData.get("item_id") as string;
  const locationId = formData.get("location_id") as string;
  const supplierId = formData.get("supplier_id") as string;
  const quantity = parseInt(formData.get("quantity") as string || "1");
  
  const problemDescription = formData.get("problem_description") as string;
  const initialCondition = formData.get("initial_condition") as string || "Rusak";
  const sentByName = formData.get("sent_by_name") as string;
  const sentDateInput = formData.get("sent_date") as string;
  const costEstimate = parseFloat(formData.get("cost") as string || "0");
  
  let serviceNumber = formData.get("service_number") as string;

  if (!itemId || !supplierId) {
    return { error: "Barang rusak dan Vendor Service wajib dipilih." };
  }

  if (isNaN(quantity) || quantity <= 0) {
    return { error: "Jumlah barang harus lebih dari 0." };
  }

  // Auto-generate Service Number if empty
  if (!serviceNumber || serviceNumber.trim() === "" || serviceNumber === "AUTO") {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from("item_services")
      .select("*", { count: "exact", head: true })
      .filter("created_at", "gte", `${date.toISOString().split('T')[0]}T00:00:00`);
    
    const seq = ((count || 0) + 1).toString().padStart(3, '0');
    serviceNumber = `SRV-${dateStr}-${seq}`;
  }

  // Handle Document Upload (Surat Jalan / Tanda Terima Awal)
  let serviceDocUrl: string | null = null;
  const file = formData.get("service_doc") as File;
  
  if (file && file.size > 0) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'services');
      const fileExt = file.name.split('.').pop();
      const fileName = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const publicPath = `/uploads/services/${fileName}`;
      const fullPath = path.join(uploadDir, fileName);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(fullPath, buffer);
      serviceDocUrl = publicPath;
    } catch (uploadErr: any) {
      console.error("Gagal mengunggah dokumen service:", uploadErr);
      // Tetap lanjutkan penyimpanan record meskipun gagal upload dokumen fisik
    }
  }

  const sentDate = sentDateInput ? new Date(sentDateInput).toISOString() : new Date().toISOString();

  // Insert Record
  const { data: service, error: insertError } = await supabase
    .from("item_services")
    .insert([{
      service_number: serviceNumber,
      item_id: itemId,
      location_id: locationId || null,
      supplier_id: supplierId,
      quantity,
      problem_description: problemDescription,
      initial_condition: initialCondition,
      sent_date: sentDate,
      sent_by_name: sentByName,
      service_doc_url: serviceDocUrl,
      status: 'Proses Service',
      cost: costEstimate,
      created_by: user?.id
    }])
    .select()
    .single();

  if (insertError) {
    console.error("Insert Service Error:", insertError);
    if (insertError.code === '23505') {
      return { error: "Nomor dokumen service sudah digunakan. Silakan gunakan nomor lain." };
    }
    return { error: `Gagal menyimpan data service: ${insertError.message}` };
  }

  revalidatePath("/services");
  redirect("/services");
}

export async function completeService(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const finalCondition = formData.get("final_condition") as string || "Normal";
  const costStr = formData.get("cost") as string;
  const cost = costStr ? parseFloat(costStr) : 0;
  const notes = formData.get("notes") as string;
  const completedDateInput = formData.get("completed_date") as string;

  // Handle Invoice Upload
  let invoiceUrl: string | undefined = undefined;
  const file = formData.get("invoice") as File;

  if (file && file.size > 0) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
      const fileExt = file.name.split('.').pop();
      const fileName = `srv-invoice-${id}-${Date.now()}.${fileExt}`;
      const publicPath = `/uploads/invoices/${fileName}`;
      const fullPath = path.join(uploadDir, fileName);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(fullPath, buffer);
      invoiceUrl = publicPath;
    } catch (err) {
      console.error("Gagal mengunggah faktur:", err);
      return { error: "Gagal menyimpan file faktur/invoice ke server." };
    }
  }

  const completedDate = completedDateInput ? new Date(completedDateInput).toISOString() : new Date().toISOString();

  const updateFields: any = {
    status: 'Selesai',
    final_condition: finalCondition,
    cost,
    notes,
    completed_date: completedDate
  };

  if (invoiceUrl) {
    updateFields.invoice_url = invoiceUrl;
  }

  const { error: updateError } = await supabase
    .from("item_services")
    .update(updateFields)
    .eq("id", id);

  if (updateError) {
    console.error("Update complete error:", updateError);
    return { error: `Gagal menyelesaikan service: ${updateError.message}` };
  }

  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  return { success: true };
}

export async function updateServiceStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_services")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: `Gagal mengubah status: ${error.message}` };
  }

  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  return { success: true };
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_services")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Gagal menghapus data service: ${error.message}` };
  }

  revalidatePath("/services");
  return { success: true };
}
