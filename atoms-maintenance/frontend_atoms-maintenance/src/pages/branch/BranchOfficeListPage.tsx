import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Plus, Pencil, Trash2, Search, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/common/Table';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { branchOfficeService } from '@/services/branchOfficeService';
import type { BranchOfficeCreatePayload, BranchOfficeSummary, BranchOfficeUpdatePayload } from '@/types/branch';

const EDIT_ROLES = ['Admin', 'Manager Teknik'];

/**
 * /branches — Kantor Cabang (Branch Office) list.
 *
 * Read-only for every maintenance role; create / edit / delete is limited to
 * Admin + Manager Teknik. Per-branch CNSD / TFP module availability lives on
 * the detail page (/branches/:id).
 */
export const BranchOfficeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = !!user?.role && EDIT_ROLES.includes(user.role);

  const [offices, setOffices] = useState<BranchOfficeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ─── Create / edit modal ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchOfficeSummary | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Delete confirm ───
  const [deleting, setDeleting] = useState<BranchOfficeSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOffices = useCallback(async () => {
    setIsLoading(true);
    try {
      setOffices(await branchOfficeService.listOffices());
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Sesi habis. Silakan login ulang.'
          : 'Gagal memuat daftar kantor cabang.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const filtered = offices.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setFormCode('');
    setFormName('');
    setFormIsActive(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (office: BranchOfficeSummary) => {
    setEditing(office);
    setFormCode(office.code);
    setFormName(office.name);
    setFormIsActive(office.is_active);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formName.trim()) {
      setFormError('Kode dan nama kantor cabang wajib diisi.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const payload: BranchOfficeUpdatePayload = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          is_active: formIsActive,
        };
        await branchOfficeService.updateOffice(editing.id, payload);
        flashSuccess('Kantor cabang berhasil diperbarui.');
      } else {
        const payload: BranchOfficeCreatePayload = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          is_active: formIsActive,
        };
        await branchOfficeService.createOffice(payload);
        flashSuccess('Kantor cabang berhasil ditambahkan.');
      }
      setIsFormOpen(false);
      await fetchOffices();
    } catch (err) {
      setFormError(
        axios.isAxiosError(err) && err.response?.status === 422
          ? 'Kode kantor cabang sudah digunakan atau data tidak valid.'
          : 'Gagal menyimpan kantor cabang.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await branchOfficeService.deleteOffice(deleting.id);
      flashSuccess('Kantor cabang berhasil dihapus.');
      setDeleting(null);
      await fetchOffices();
    } catch {
      setErrorMessage('Gagal menghapus kantor cabang.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Building2}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title="Kantor Cabang"
        subtitle="Daftar kantor cabang beserta ketersediaan modul CNSD & TFP per cabang."
        actions={canEdit && (
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus size={16} /> Tambah Cabang
          </Button>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kode cabang…"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            aria-label="Cari kantor cabang"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Bersihkan pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="h-10 rounded bg-gray-100 animate-pulse" />
            <div className="h-10 rounded bg-gray-100 animate-pulse" />
            <div className="h-10 rounded bg-gray-100 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Belum ada kantor cabang"
            description="Tambahkan kantor cabang untuk mulai mengatur ketersediaan modul CNSD & TFP per cabang."
            action={canEdit && <Button onClick={openCreate} className="gap-2"><Plus size={16} /> Tambah Cabang</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Kantor Cabang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Modul CNSD</TableHead>
                <TableHead className="text-center">Modul TFP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{office.code}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(`/branches/${office.id}`)}
                      className="inline-flex items-center gap-1 font-medium text-slate-800 hover:text-brand-primary transition-colors"
                    >
                      {office.name}
                      <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        office.is_active
                          ? 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700'
                          : 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600'
                      }
                    >
                      {office.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{office.cnsd_available_count}</TableCell>
                  <TableCell className="text-center">{office.tfp_available_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(office)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-colors"
                            aria-label={`Edit ${office.name}`}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(office)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            aria-label={`Hapus ${office.name}`}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </>
                      )}
                      {!canEdit && (
                        <button
                          type="button"
                          onClick={() => navigate(`/branches/${office.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-colors"
                        >
                          <ChevronRight size={14} /> Detail
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / edit modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? 'Edit Kantor Cabang' : 'Tambah Kantor Cabang'}>
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}
          <Input label="Kode" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="cth: KDR" maxLength={20} />
          <Input label="Nama Kantor Cabang" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="cth: Cabang Kediri" maxLength={200} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            Aktif
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {editing ? 'Simpan Perubahan' : 'Simpan Cabang'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Kantor Cabang?"
        message={
          deleting
            ? `Kantor cabang "${deleting.name}" beserta konfigurasi modulnya akan dihapus. Tindakan ini tidak menghapus data modul CNSD/TFP yang sudah ada.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        isLoading={isDeleting}
      />
    </div>
  );
};