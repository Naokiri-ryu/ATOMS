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
    const map: Record<string, string> = { P: 'Pagi', S: 'Siang', M: 'Malam' };
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
            <p><strong>Hari / Tanggal</strong> : {record.tanggal}</p>
            <p><strong>Shift : {getShiftLabel(record.shift)}</strong></p>
            <p><strong>Jam : {record.jam}</strong></p>
          </div>
        </div>

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
            {record.items.map((item) => (
              <tr key={item.nomor}>
                <td className="border border-slate-400 px-2 py-1 text-center">{item.nomor}</td>
                <td className="border border-slate-400 px-2 py-1">{item.uraian_pekerjaan}</td>
                <td className="border border-slate-400 px-2 py-1 text-center">
                  {item.kondisi_baik ? '✓' : ''}
                </td>
                <td className="border border-slate-400 px-2 py-1 text-center">
                  {item.kondisi_tidak_baik ? '✓' : ''}
                </td>
                <td className="border border-slate-400 px-2 py-1">{item.nilai || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-6 p-4 border border-slate-300">
          <p className="font-semibold mb-2">Status Operasi: {record.status_operasi || '-'}</p>
          <p className="font-semibold">Status: {record.status_master_slave || '-'}</p>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">MANAGER TEKNIK</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">SUPERVISOR</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">TEKNISI</p>
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