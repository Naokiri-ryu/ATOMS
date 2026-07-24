import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpGensetRadarService } from '@/services/tfpGensetRadarService';
import type { TfpGensetRadarRecordDetail } from '@/types/tfpGensetRadar';

export const TfpGensetRadarPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpGensetRadarRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecord();
    }
  }, [id]);

  const fetchRecord = async () => {
    try {
      const data = await tfpGensetRadarService.getRecord(Number(id));
      setRecord(data);
    } catch (error) {
      console.error('Failed to fetch record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!record) {
    return <div className="p-8 text-center">Record not found</div>;
  }

  const getShiftLabel = (shift: string) => {
    const map: Record<string, string> = { pagi: 'Pagi', siang: 'Siang', malam: 'Malam' };
    return map[shift] || shift;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(`/tfp/genset-radar/${id}`)} className="gap-2">
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          Cetak
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">
            PERFORMANCE CHECK GENSET RADAR TEKNIK FASILITAS PENUNJANG
          </h1>
          <h2 className="text-lg font-semibold">AIRNAV CABANG SURABAYA</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p><strong>ENGINE</strong> : {record.engine}</p>
            <p><strong>ALTERNATOR</strong> : {record.alternator}</p>
            <p><strong>KAPASITAS</strong> : {record.kapasitas}</p>
          </div>
          <div className="text-right">
            <p><strong>Hari / Tanggal</strong> : {record.day_name}, {record.date}</p>
            <p><strong>Shift</strong> : {getShiftLabel(record.shift_type)}</p>
            <p><strong>Jam</strong> : {record.time_filled}</p>
          </div>
        </div>

        {/* Facilities Section */}
        {record.facilities && record.facilities.length > 0 && (
          <>
            <h3 className="font-bold text-sm mb-2">URAIAN PEKERJAAN</h3>
            <table className="w-full border-collapse border border-slate-400 text-sm mb-6">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 px-2 py-1 w-12">NO</th>
                  <th className="border border-slate-400 px-2 py-1">URAIAN PEKERJAAN</th>
                  <th className="border border-slate-400 px-2 py-1 text-center" colSpan={2}>KONDISI</th>
                  <th className="border border-slate-400 px-2 py-1">KETERANGAN</th>
                </tr>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 px-2 py-1"></th>
                  <th className="border border-slate-400 px-2 py-1"></th>
                  <th className="border border-slate-400 px-2 py-1 text-center text-xs">BAIK</th>
                  <th className="border border-slate-400 px-2 py-1 text-center text-xs">TIDAK BAIK</th>
                  <th className="border border-slate-400 px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {record.facilities.map((f, idx) => (
                  <tr key={f.id}>
                    <td className="border border-slate-400 px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 px-2 py-1">{f.facility_name}</td>
                    <td className="border border-slate-400 px-2 py-1 text-center">
                      {f.kondisi === 'Baik' ? '✓' : ''}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center">
                      {f.kondisi === 'Tidak Baik' ? '✓' : ''}
                    </td>
                    <td className="border border-slate-400 px-2 py-1">{f.keterangan || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Parameters Section */}
        <h3 className="font-bold text-sm mb-2">PARAMETER PENGUKURAN</h3>
        <table className="w-full border-collapse border border-slate-400 text-sm mb-6">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-slate-400 px-2 py-1 w-12">NO</th>
              <th className="border border-slate-400 px-2 py-1">PARAMETER</th>
              <th className="border border-slate-400 px-2 py-1 text-center">NILAI</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((item) => {
              const isGroupLabel = item.group_label && item.parameter_number &&
                record.items.filter(i => i.group_label === item.group_label && i.parameter_number === item.parameter_number)[0]?.id === item.id;

              if (isGroupLabel) {
                return (
                  <tr key={item.id} className="bg-slate-100">
                    <td className="border border-slate-400 px-2 py-1 text-center font-bold" colSpan={2}>
                      {item.group_label}
                    </td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                  </tr>
                );
              }

              const value = item.values && typeof item.values === 'object'
                ? Object.values(item.values)[0] || ''
                : '';

              return (
                <tr key={item.id}>
                  <td className="border border-slate-400 px-2 py-1 text-center">{item.parameter_number}</td>
                  <td className="border border-slate-400 px-2 py-1">
                    {item.parameter_name}
                    {item.unit && <span className="text-xs text-slate-500 ml-1">({item.unit})</span>}
                  </td>
                  <td className="border border-slate-400 px-2 py-1 text-center">{value || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Status Operasi */}
        <div className="mb-6 p-4 border border-slate-300">
          <p className="font-semibold mb-2">Status Operasi: {record.status_operasi?.replace('_', ' ') || '-'}</p>
          <p className="font-semibold mb-2">Status: {record.status_master_slave || '-'}</p>
          {record.fuel_level && <p className="font-semibold mb-2">Fuel Level: {record.fuel_level}</p>}
          {record.catatan && <p className="font-semibold">Catatan: {record.catatan}</p>}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2">
              {record.manager?.signature && (
                <img src={record.manager.signature} alt="TTD Manager" className="h-16 object-contain" />
              )}
            </div>
            <p className="font-semibold text-sm">MANAGER TEKNIK</p>
            <p className="text-xs text-slate-500">{record.manager?.name || '—'}</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2">
              {record.supervisor?.signature && (
                <img src={record.supervisor.signature} alt="TTD Supervisor" className="h-16 object-contain" />
              )}
            </div>
            <p className="font-semibold text-sm">SUPERVISOR</p>
            <p className="text-xs text-slate-500">{record.supervisor?.name || '—'}</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2">
              {record.technicians?.[0]?.signature && (
                <img src={record.technicians[0].signature} alt="TTD Teknisi" className="h-16 object-contain" />
              )}
            </div>
            <p className="font-semibold text-sm">TEKNISI</p>
            <p className="text-xs text-slate-500">{record.technicians?.[0]?.technician_name || '—'}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
