import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/core/AuthContext';
import { adminService } from '../../../services/adminService';
import { EmployeeProfileModal } from '../../../components';
import type { Employee, User } from '../../../types';
import {
  ArrowLeft,
  BadgeCheck,
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  Fingerprint,
  LogIn,
  Mail,
  MapPin,
  Pencil,
  Users,
} from 'lucide-react';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value;
}

function formatValidUntil(value?: string | null): string {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value?.trim() || '—';
}

function isRatingExpired(validUntil?: string | null): boolean {
  const match = validUntil?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return false;
  const expiry = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry.getTime() < today.getTime();
}

function getInitials(name?: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '?').substring(0, 2).toUpperCase();
}

function formatLastLogin(value?: string | null): string {
  if (!value) return 'Belum pernah login';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: sessionUser } = useAuth();

  const employeeId = Number(id);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canEdit = useCallback(
    (employee: Employee) =>
      !!sessionUser &&
      (sessionUser.role === 'Admin' || employee.user_id === sessionUser.id),
    [sessionUser]
  );

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(employeeId)) {
      setLoadError('ID personel tidak valid');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await adminService.getPublicProfile(employeeId);
      setProfile(data);
    } catch {
      setLoadError('Profil tidak ditemukan atau Anda tidak memiliki akses.');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-24 text-slate-500 animate-pulse">
          Memuat profil personel...
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <Users className="h-12 w-12 text-navy-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Profil tidak ditemukan</h3>
          <p className="text-slate-600 mb-6">{loadError || 'Terjadi kesalahan saat memuat profil.'}</p>
          <button
            onClick={() => navigate('/personnel')}
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white px-5 py-2 rounded-lg transition-colors font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </button>
        </div>
      </div>
    );
  }

  const p = profile;
  const name = p.user?.name || sessionUser?.name || 'Personel';
  const userName: User | null = p.user || sessionUser;
  const unitKerja = p.unit_kerja || '—';
  const editable = canEdit(p);

  const roleBadgeColor: Record<string, string> = {
    'Admin': 'bg-white/15 text-white border-white/25',
    'Cns': 'bg-amber-400 text-navy-900 border-amber-300',
    'Support': 'bg-emerald-400 text-emerald-950 border-emerald-300',
    'Manager Teknik': 'bg-orange-400 text-orange-950 border-orange-300',
    'General Manager': 'bg-red-400 text-red-950 border-red-300',
  };

  const statItems = [
    { icon: Fingerprint, label: 'NIK', value: p.nik || '—' },
    { icon: Briefcase, label: 'Grade', value: userName?.grade != null ? String(userName.grade) : '—' },
    { icon: Award, label: 'Rating', value: String(p.ratings?.length || 0) },
    { icon: BadgeCheck, label: 'Lisensi', value: String(p.licenses?.length || 0) },
  ];

  const detailItems = [
    { icon: Fingerprint, label: 'NIK', value: p.nik || '—' },
    { icon: MapPin, label: 'Tempat Lahir', value: p.birth_place || '—' },
    { icon: CalendarDays, label: 'Tanggal Lahir', value: formatDate(p.birth_date) },
    { icon: Building2, label: 'Unit Kerja', value: unitKerja },
    { icon: Briefcase, label: 'Jabatan', value: p.jabatan || '—' },
    { icon: Mail, label: 'Email', value: userName?.email || '—' },
    { icon: LogIn, label: 'Terakhir Masuk', value: formatLastLogin(userName?.last_login) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-700 via-navy-800 to-navy-900 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-400/10"></div>
        <div className="absolute -right-4 -top-4 w-40 h-40 rounded-full bg-amber-400/10"></div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-2xl sm:text-3xl font-bold text-navy-900 shadow-lg flex-shrink-0">
            {getInitials(name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold break-words">{name}</h1>
              {userName?.role && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadgeColor[userName.role] || 'bg-white/15 text-white border-white/25'}`}>
                  {userName.role}
                </span>
              )}
              {unitKerja !== '—' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-500/60 text-white border border-white/15">
                  {unitKerja}
                </span>
              )}
            </div>
            {p.jabatan && <p className="mt-1.5 text-white/80 text-sm sm:text-base">{p.jabatan}</p>}
            {userName?.email && <p className="mt-1 text-white/60 text-sm">{userName.email}</p>}
          </div>

          {editable && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-navy-900 font-semibold px-4 py-2 rounded-xl shadow-md transition-colors flex-shrink-0"
            >
              <Pencil className="h-4 w-4" />
              Edit Profil
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/60 text-[11px] font-semibold uppercase tracking-wide">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
              <div className="mt-1 text-lg font-bold truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Data Dasar */}
        <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy-900 mb-5">
            <BadgeCheck className="h-4 w-4 text-navy-600" />
            Data Dasar
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {detailItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-navy-600" />
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
                  <dd className="text-sm font-medium text-gray-800 break-words mt-0.5">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* Rating */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy-900 mb-5">
            <Award className="h-4 w-4 text-amber-500" />
            Rating & Kewenangan
          </h2>
          {!p.ratings || p.ratings.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada rating tercatat.</p>
          ) : (
            <ul className="space-y-3">
              {p.ratings.map((r) => {
                const expired = isRatingExpired(r.valid_until);
                const statusClass = !r.valid_until
                  ? 'bg-navy-50 text-navy-700 border-navy-200'
                  : expired
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200';
                return (
                  <li key={r.id} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-gray-900">{r.rating}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                        {!r.valid_until
                          ? 'Selamanya'
                          : expired
                          ? 'Kedaluwarsa'
                          : 'Berlaku'}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-500">
                      Berlaku sampai: <span className="font-medium">{formatValidUntil(r.valid_until)}</span>
                      {r.keterangan && <span> • {r.keterangan}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Lisensi */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy-900 mb-5">
            <BadgeCheck className="h-4 w-4 text-amber-500" />
            Lisensi / Sertifikasi
          </h2>
          {!p.licenses || p.licenses.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada lisensi tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-gray-100">
                    <th className="px-3 py-2 font-semibold">Nama Lisensi</th>
                    <th className="px-3 py-2 font-semibold">Nomor</th>
                    <th className="px-3 py-2 font-semibold">Berlaku Sampai</th>
                    <th className="px-3 py-2 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {p.licenses.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50">
                      <td className="px-3 py-3 font-semibold text-gray-900">{l.license_name || '—'}</td>
                      <td className="px-3 py-3 text-slate-600">{l.license_number || '—'}</td>
                      <td className="px-3 py-3 text-slate-600">{l.valid_until ? formatValidUntil(l.valid_until) : '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{l.keterangan || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Edit Modal (self or admin) */}
      {editable && (
        <EmployeeProfileModal
          isOpen={isEditOpen}
          employee={p}
          userName={name}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            loadProfile();
          }}
        />
      )}
    </div>
  );
};

export default EmployeeProfilePage;