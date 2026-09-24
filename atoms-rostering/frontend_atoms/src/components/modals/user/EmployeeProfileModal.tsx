import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../common/Modal';
import Button from '../../ui/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import { adminService } from '../../../services/adminService';
import { useAuth } from '../../../modules/auth/core/AuthContext';
import type { Employee, EmployeeProfileUpdateRequest } from '../../../types';
import { Plus, Trash2, BadgeCheck, Award, Loader2 } from 'lucide-react';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  employee: Employee;
  userName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LicenseRow {
  license_name: string;
  license_number: string;
  valid_until: string;
  keterangan: string;
}

interface RatingRow {
  rating: string;
  valid_until: string;
  keterangan: string;
}

const RATING_OPTIONS = [
  { value: 'NAVIGASI', label: 'NAVIGASI' },
  { value: 'COMMUNICATION', label: 'COMMUNICATION' },
  { value: 'SURVEILLANCE', label: 'SURVEILLANCE' },
  { value: 'DATA PROCESSING', label: 'DATA PROCESSING' },
  { value: 'TRD', label: 'TRD' },
  { value: 'PSS', label: 'PSS' },
  { value: 'GNS', label: 'GNS' },
  { value: 'ACS', label: 'ACS' },
  { value: 'TQM', label: 'TQM' },
];

const UNIT_KERJA_OPTIONS = [
  { value: '', label: '—' },
  { value: 'CNSD', label: 'CNSD — Teknik Telekomunikasi' },
  { value: 'TFP', label: 'TFP — Teknik Fasilitas Penunjang' },
];

const EMPTY_LICENSE = { license_name: '', license_number: '', valid_until: '', keterangan: '' };
const EMPTY_RATING = { rating: '', valid_until: '', keterangan: '' };

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ isOpen, employee, userName, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isSelfProfile = user?.employee?.id === employee.id;
  const[isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{
    nik: string;
    birth_place: string;
    birth_date: string;
    unit_kerja: EmployeeProfileUpdateRequest['unit_kerja'];
    jabatan: string;
    licenses: LicenseRow[];
    ratings: RatingRow[];
  }>({
    nik: employee.nik || '',
    birth_place: employee.birth_place || '',
    birth_date: employee.birth_date || '',
    unit_kerja: employee.unit_kerja || null,
    jabatan: employee.jabatan || '',
    licenses: [],
    ratings: [],
  });

  // Fetch the full profile (including licenses & ratings) every time the modal opens
  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      nik: employee.nik || '',
      birth_place: employee.birth_place || '',
      birth_date: employee.birth_date || '',
      unit_kerja: employee.unit_kerja || null,
      jabatan: employee.jabatan || '',
      licenses: [],
      ratings: [],
    });
    setIsLoading(true);

    let cancelled = false;
    (isSelfProfile ? adminService.getPublicProfile(employee.id) : adminService.getEmployeeProfile(employee.id))
      .then((profile) => {
        if (cancelled) return;
        setFormData((prev) => ({
          ...prev,
          nik: profile.nik || '',
          birth_place: profile.birth_place || '',
          birth_date: profile.birth_date || '',
          unit_kerja: profile.unit_kerja || null,
          jabatan: profile.jabatan || '',
          licenses: (profile.licenses || []).map((l) => ({
            license_name: l.license_name || '',
            license_number: l.license_number || '',
            valid_until: l.valid_until || '',
            keterangan: l.keterangan || '',
          })),
          ratings: (profile.ratings || []).map((r) => ({
            rating: r.rating || '',
            valid_until: r.valid_until || '',
            keterangan: r.keterangan || '',
          })),
        }));
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, 'Failed to load employee profile'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, employee.id, employee.nik, employee.birth_place, employee.birth_date, employee.unit_kerja, employee.jabatan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload: EmployeeProfileUpdateRequest = {
      nik: formData.nik?.trim() || null,
      birth_place: formData.birth_place?.trim() || null,
      birth_date: formData.birth_date || null,
      unit_kerja: formData.unit_kerja || null,
      jabatan: formData.jabatan?.trim() || null,
      // Send arrays so the backend knows whether to update or delete all.
      // If empty array [] is sent, backend deletes all existing licenses/ratings.
      licenses: (formData.licenses || [])
        .filter((l) => l.license_name?.trim() || l.license_number?.trim())
        .map((l) => ({
          license_name: l.license_name?.trim() || null,
          license_number: l.license_number?.trim() || null,
          valid_until: l.valid_until?.trim() || null,
          keterangan: l.keterangan?.trim() || null,
        })),
      ratings: (formData.ratings || [])
        .filter((r) => r.rating && r.rating.trim())
        .map((r) => ({
          rating: r.rating.trim(),
          valid_until: r.valid_until?.trim() || null,
          keterangan: r.keterangan?.trim() || null,
        })),
    };

    try {
      if (isSelfProfile) {
        await adminService.updateProfile(employee.id, payload);
      } else {
        await adminService.updateEmployeeProfile(employee.id, payload);
      }
      toast.success('Employee profile updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update employee profile'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateLicense = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const licenses = (prev.licenses || []).map((l, i) => (i === index ? { ...l, [field]: value } : l));
      return { ...prev, licenses };
    });
  };

  const updateRating = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const ratings = (prev.ratings || []).map((r, i) => (i === index ? { ...r, [field]: value } : r));
      return { ...prev, ratings };
    });
  };

  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900 uppercase tracking-wide">
      {icon}
      {text}
    </h3>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Profil Personel — ${employee.user?.name || userName || 'Personel'}`} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          {sectionTitle(<BadgeCheck className="h-4 w-4 text-navy-700" />, 'Data Dasar')}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="NIK"
              value={formData.nik || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nik: e.target.value })}
              disabled={isLoading}
            />
            <Input
              label="Tempat Lahir"
              value={formData.birth_place || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, birth_place: e.target.value })}
              disabled={isLoading}
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={formData.birth_date || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, birth_date: e.target.value })}
              disabled={isLoading}
            />
            <Select
              label="Unit Kerja"
              options={UNIT_KERJA_OPTIONS}
              value={formData.unit_kerja || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, unit_kerja: (e.target.value || null) as EmployeeProfileUpdateRequest['unit_kerja'] })
              }
              disabled={isLoading}
            />
            <Input
              label="Jabatan"
              className="lg:col-span-2"
              value={formData.jabatan || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, jabatan: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Licenses */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            {sectionTitle(<Award className="h-4 w-4 text-navy-700" />, 'Lisensi')}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, licenses: [...(formData.licenses || []), { ...EMPTY_LICENSE }] })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Lisensi
            </Button>
          </div>
          {(formData.licenses || []).length > 0 && (
            <div className="mt-3 space-y-3">
              {(formData.licenses || []).map((license, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Lisensi #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, licenses: (formData.licenses || []).filter((_, i) => i !== index) })}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Hapus lisensi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Nama Lisensi"
                      value={license.license_name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateLicense(index, 'license_name', e.target.value)}
                    />
                    <Input
                      label="Nomor Lisensi"
                      value={license.license_number}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateLicense(index, 'license_number', e.target.value)}
                    />
                    <Input
                      label="Berlaku Sampai"
                      placeholder="e.g. SEUMUR HIDUP atau tanggal (YYYY-MM-DD)"
                      value={license.valid_until}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateLicense(index, 'valid_until', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            {sectionTitle(<Award className="h-4 w-4 text-navy-700" />, 'Rating')}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, ratings: [...(formData.ratings || []), { ...EMPTY_RATING }] })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Rating
            </Button>
          </div>
          {(formData.ratings || []).length > 0 && (
            <div className="mt-3 space-y-3">
              {(formData.ratings || []).map((rating, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Rating #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ratings: (formData.ratings || []).filter((_, i) => i !== index) })}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Hapus rating"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Jenis Rating"
                      options={RATING_OPTIONS}
                      value={rating.rating}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRating(index, 'rating', e.target.value)}
                    />
                    <Input
                      label="Berlaku Sampai"
                      placeholder="e.g. 2027-12-05"
                      value={rating.valid_until}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateRating(index, 'valid_until', e.target.value)}
                    />
                    <Input
                      label="Keterangan"
                      value={rating.keterangan}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateRating(index, 'keterangan', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading profil...
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t w-full -mx-6 px-6">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving} disabled={isLoading} className="flex-1 bg-navy-700 hover:bg-navy-800">
            Simpan Profil
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeProfileModal;