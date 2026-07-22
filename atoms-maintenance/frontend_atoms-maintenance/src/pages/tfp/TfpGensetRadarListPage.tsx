import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { tfpGensetRadarService } from '@/services/tfpGensetRadarService';
import type { TfpGensetRadarRecord } from '@/types/tfpGensetRadar';

export const TfpGensetRadarListPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TfpGensetRadarRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const data = await tfpGensetRadarService.getRecords();
      setRecords(data.data || data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftLabel = (shift: string) => {
    const map: Record<string, string> = { P: 'Pagi', S: 'Siang', M: 'Malam' };
    return map[shift] || shift;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">TFP Genset Radar</h1>
          <p className="text-slate-500 mt-1">Performance Check Genset Radar Teknik Fasilitas Penunjang</p>
        </div>
        <Button onClick={() => navigate('/tfp/genset-radar/new')} className="gap-2">
          <Plus size={18} />
          Buat Form Baru
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari form number..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Form Number</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Shift</th>
                <th className="px-4 py-3 text-left font-semibold">Engine</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{record.form_number}</td>
                    <td className="px-4 py-3">{record.tanggal}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                        {getShiftLabel(record.shift)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{record.engine}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} variant="pill" />
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/tfp/genset-radar/${record.id}`)}
                      >
                        Lihat Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};