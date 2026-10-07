import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { branchOfficeService } from "@/services/branchOfficeService";
import type { BranchOfficeDetail } from "@/types/branch";

/**
 * /branches/:id/readiness — Detail Kesiapan Peralatan CNSD per Cabang.
 *
 * Menampilkan ringkasan modul kesiapan dan memungkinkan Admin/Manager Teknik
 * untuk memasukkan data ketersediaan modul di cabang ini.
 */
export const ReadinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const branchId = Number(id);
  const canEdit = !!user?.role && ["Admin", "Manager Teknik"].includes(user.role);

  const [office, setOffice] = useState<BranchOfficeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formValue, setFormValue] = useState("");
  const [formShift, setFormShift] = useState<"pagi" | "siang" | "malam">("pagi");
  const [formDate, setFormDate] = useState<string | null>(null);
  const [formNotes, setFormNotes] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load office + modul stats
  const loadOffice = useCallback(async () => {
    try {
      const res = await branchOfficeService.getOffice(branchId);
      setOffice(res);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Gagal memuat kantor cabang.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void loadOffice();
  }, [loadOffice]);

  // === Tambah Reading (modal) ===
  const handleSaveReading = async () => {
    if (!formValue.trim()) {
      setErrorMessage("Nilai kesiapan wajib diisi.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/v1/branches/${branchId}/readings`,
        {
          module_key: "cnsd-readiness",
          value: formValue,
          shift_type: formShift,
          date: formDate,
          notes: formNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        }
      );
      setSuccessMessage("Data kesiapan berhasil disimpan.");
      setTimeout(() => setSuccessMessage(null), 2500);
      setIsFormOpen(false);
      await loadOffice();
    } catch (err) {
      setErrorMessage("Gagal menyimpan data kesiapan.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => navigate("/branches")}>
          <Building2 size={16} /> Kembali ke Daftar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      <Link to="/branches" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-primary transition-colors">
        <Building2 size={15} /> Kantor Cabang
      </Link>

      <PageHeader
        icon={Building2}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title="Kesiapan Peralatan CNSD"
        subtitle={`Kode ${office?.code} · ${office?.is_active ? "Aktif" : "Nonaktif"}`}
        actions={
          canEdit && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <CheckCircle size={16} /> Input Kesiapan
            </Button>
          )
        }/>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-3">Ringkasan Kesiapan</h3>
        {office?.modules?.cnsd?.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada modul CNSD terdaftar untuk cabang ini.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Modul Tersedia: <strong>{office?.modules?.cnsd?.length || 0}</strong>
            </p>
            <p className="text-sm text-slate-500">
              Terakhir diupdate: {office?.updated_at ? new Date(office.updated_at).toLocaleDateString("id-ID") : "—"}
            </p>
          </div>
        )}
      </div>

      {/* Modal Input Kesiapan Baru */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={(e) => e.target?.click()}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" role="dialog">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Input Kesiapan Peralatan CNSD</h3>

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-3">{errorMessage}</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSaveReading(); }} className="space-y-4">
              <Input
                label="Nilai Kesiapan"
                value={formValue}
                onChange={(e: any) => setFormValue((e: any) => e.target.value)}
                placeholder="Contoh: 100% atau Lunas"
                maxLength={50}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm text-slate-700">
                  <input
                    type="radio"
                    name="shift"
                    value="pagi"
                    checked={formShift === "pagi"}
                    onChange={(e: any) => setFormShift("pagi")}
                    className="peer h-4 w-4 rounded border border-gray-300 peer-checked:bg-brand-primary peer-checked:shadow-outline"
                  />
                  <span className="ml-2 text-sm">Pagi (07:15 - 13:15)</span>
                </label>
                <label className="block text-sm text-slate-700">
                  <input
                    type="radio"
                    name="shift"
                    value="siang"
                    checked={formShift === "siang"}
                    onChange={(e: any) => setFormShift("siang")}
                    className="peer h-4 w-4 rounded border border-gray-300 peer-checked:bg-brand-primary peer-checked:shadow-outline"
                  />
                  <span className="ml-2 text-sm">Siang (13:15 - 19:15)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-700">
                  <input
                    type="date"
                    value={formDate || ""}
                    onChange={(e: any) => setFormDate((e: any) => e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    required
                  />
                </label>
              </div>

              <Input
                label="Catatan (opsional)"
                value={formNotes}
                onChange={(e: any) => setFormNotes((e: any) => e.target.value)}
                placeholder="Catatan tambahan..."
                maxLength={200}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                <Button onClick={handleSaveReading}>Simpan Kesiapan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};