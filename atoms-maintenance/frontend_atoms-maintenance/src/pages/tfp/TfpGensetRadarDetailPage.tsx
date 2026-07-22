import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Users, Calendar, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpGensetRadarService } from '@/services/tfpGensetRadarService';
import type { TfpGensetRadarRecordDetail, TfpGensetRadarItem } from '@/types/tfpGensetRadar';

export const TfpGensetRadarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpGensetRadarRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultItems: Partial<TfpGensetRadarItem>[] = [
    { nomor: 1, uraian_pekerjaan: 'Pemeriksaan Battery Stater', satuan: '' },
    { nomor: 2, uraian_pekerjaan: 'Pemeriksaan Level Oli Mesin', satuan: '' },
    { nomor: 3, uraian_pekerjaan: 'Pemeriksaan Air Radiator', satuan: '' },
    { nomor: 4, uraian_pekerjaan: 'Pemeriksaan Kontaktor-Kontaktor pada Panel ACOS', satuan: '' },
    { nomor: 5, uraian_pekerjaan: 'Pemeriksaan Lampu-Lampu Indikator', satuan: '' },
    { nomor: 6, uraian_pekerjaan: 'Pemeriksaan Indikator Volt meter, Ampere meter, Frequency', satuan: '' },
    { nomor: 7, uraian_pekerjaan: 'Pemeriksaan Relay-relay Kontrol (Safety Devices)', satuan: '' },
    { nomor: 8, uraian_pekerjaan: 'Pemeriksaan Vent Belt', satuan: '' },
    { nomor: 9, uraian_pekerjaan: 'Pemeriksaan dan Membersihkan Pompa BBM', satuan: '' },
    { nomor: 10, uraian_pekerjaan: 'Membersihkan Saringan Udara', satuan: '' },
    { nomor: 11, uraian_pekerjaan: 'Membersihkan Genset, Panel ACOS dan Ruang Sekitarnya', satuan: '' },
    { nomor: 12, uraian_pekerjaan: 'Pengetesan Genset Secara Auto No Load (tanpa beban)', satuan: 'Selama : ±' },
    { nomor: 13, uraian_pekerjaan: 'Pengetesan Genset Secara Auto On Load (dengan beban)', satuan: 'Selama : ±' },
    { nomor: 14, uraian_pekerjaan: 'Pengetesan Genset Secara Manual No Load', satuan: 'Selama : ±' },
    { nomor: 15, uraian_pekerjaan: 'Pengetesan Genset Secara Manual On Load', satuan: 'Selama : ±' },
    { nomor: 16, uraian_pekerjaan: 'Kondisi Genset', satuan: '' },
    { nomor: 17, uraian_pekerjaan: 'Pegukuran Tegangan Output Genset', satuan: '' },
    { nomor: 18, uraian_pekerjaan: 'Pengukuran Arus Beban', satuan: '' },
    { nomor: 19, uraian_pekerjaan: 'Pemeriksaan Frequency', satuan: 'Hz' },
    { nomor: 20, uraian_pekerjaan: 'Pemeriksaan RPM', satuan: 'Rpm' },
    { nomor: 21, uraian_pekerjaan: 'Pengukuran Tegangan Battery Starter', satuan: 'Vdc' },
    { nomor: 22, uraian_pekerjaan: 'Pemeriksaan Jam Kerja Mesin (Hour Counter)', satuan: 'Hr' },
    { nomor: 23, uraian_pekerjaan: 'Pemeriksaan Oil Pressure', satuan: 'Bar' },
    { nomor: 24, uraian_pekerjaan: 'Pemeriksaan Temperatur Cooling Water', satuan: '°C' },
    { nomor: 25, uraian_pekerjaan: 'Temperatur Ruangan Genset', satuan: '°C' },
    { nomor: 26, uraian_pekerjaan: 'Daya yang terpakai', satuan: 'KW' },
    { nomor: 27, uraian_pekerjaan: 'Pengukuran Tegangan PLN / Output Stabilizer', satuan: '' },
    { nomor: 28, uraian_pekerjaan: 'KWH meter', satuan: '' },
    { nomor: 29, uraian_pekerjaan: 'BBM yang terpakai', satuan: 'Liter' },
    { nomor: 30, uraian_pekerjaan: 'Pemeriksaan Tangki Induk', satuan: 'Liter' },
    { nomor: 31, uraian_pekerjaan: 'Pemeriksaan Tangki Harian', satuan: 'Liter' },
    { nomor: 32, uraian_pekerjaan: 'Pemeriksaan Cadangan Battery', satuan: 'Liter' },
    { nomor: 33, uraian_pekerjaan: 'Pemeriksaan Cadangan Oli Pelumas', satuan: 'Liter' },
  ];

  useEffect(() => {
    if (id && id !== 'new') {
      fetchRecord();
    } else {
      setRecord({
        id: 0,
        form_number: 'TFP-GENSET-RADAR-' + new Date().getTime(),
        tanggal: new Date().toISOString().split('T')[0],
        shift: 'P',
        jam: '',
        engine: 'DEUTZ',
        alternator: 'LEROY SUMMER',
        kapasitas: '150 KVA',
        status_operasi: null,
        status_master_slave: null,
        status: 'draft',
        technicians: [],
        items: defaultItems as TfpGensetRadarItem[],
        created_at: '',
        updated_at: '',
      });
      setLoading(false);
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

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      if (record.id === 0) {
        await tfpGensetRadarService.createRecord(record);
      } else {
        await tfpGensetRadarService.updateRecord(record.id, record);
      }
      navigate('/tfp/genset-radar');
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: keyof TfpGensetRadarItem, value: any) => {
    if (!record) return;
    const newItems = [...record.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setRecord({ ...record, items: newItems });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => navigate('/tfp')} className="hover:text-slate-700">TFP</button>
        <span>/</span>
        <button onClick={() => navigate('/tfp/genset-radar')} className="hover:text-slate-700">Genset Radar</button>
        <span>/</span>
        <span className="text-slate-900 font-medium">{record?.form_number}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tfp/genset-radar')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Performance Check Genset Radar</h1>
              <p className="text-slate-500 mt-1">Teknik Fasilitas Penunjang Airnav Cabang Surabaya</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/tfp/genset-radar/${record?.id}/print`)}>
              <Printer size={16} />
              Print
            </Button>
            <Button onClick={handleSave} isLoading={saving} className="gap-2">
              <Save size={16} />
              Simpan
            </Button>
          </div>
        </div>

        {/* Header Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Engine</label>
            <input
              type="text"
              value={record?.engine || ''}
              onChange={(e) => setRecord({ ...record!, engine: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Alternator</label>
            <input
              type="text"
              value={record?.alternator || ''}
              onChange={(e) => setRecord({ ...record!, alternator: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Kapasitas</label>
            <input
              type="text"
              value={record?.kapasitas || ''}
              onChange={(e) => setRecord({ ...record!, kapasitas: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Hari / Tanggal</label>
            <input
              type="date"
              value={record?.tanggal || ''}
              onChange={(e) => setRecord({ ...record!, tanggal: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Shift</label>
            <select
              value={record?.shift || 'P'}
              onChange={(e) => setRecord({ ...record!, shift: e.target.value as any })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              <option value="P">Pagi</option>
              <option value="S">Siang</option>
              <option value="M">Malam</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase">Jam</label>
            <input
              type="time"
              value={record?.jam || ''}
              onChange={(e) => setRecord({ ...record!, jam: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold w-12">NO</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold">URAIAN PEKERJAAN</th>
                <th className="border border-slate-300 px-3 py-2 text-center font-semibold" colSpan={2}>KONDISI</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold">KETERANGAN</th>
              </tr>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-1"></th>
                <th className="border border-slate-300 px-3 py-1"></th>
                <th className="border border-slate-300 px-3 py-1 text-center text-xs">BAIK</th>
                <th className="border border-slate-300 px-3 py-1 text-center text-xs">TIDAK BAIK</th>
                <th className="border border-slate-300 px-3 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {record?.items.map((item, index) => (
                <tr key={item.nomor} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2 text-center">{item.nomor}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    <div className="font-medium">{item.uraian_pekerjaan}</div>
                    {item.satuan && <div className="text-xs text-slate-500 mt-1">{item.satuan}</div>}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.kondisi_baik || false}
                      onChange={(e) => updateItem(index, 'kondisi_baik', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.kondisi_tidak_baik || false}
                      onChange={(e) => updateItem(index, 'kondisi_tidak_baik', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    <input
                      type="text"
                      value={item.nilai || ''}
                      onChange={(e) => updateItem(index, 'nilai', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
                      placeholder={item.satuan || 'Keterangan'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Operasi */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-3">Status Operasi:</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="status_operasi" 
                value="PLN OFF" 
                checked={record?.status_operasi === 'PLN OFF'}
                onChange={(e) => setRecord({ ...record!, status_operasi: e.target.value as any })}
                className="w-4 h-4" 
              />
              <span>PLN OFF</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="status_operasi" 
                value="RUN UP" 
                checked={record?.status_operasi === 'RUN UP'}
                onChange={(e) => setRecord({ ...record!, status_operasi: e.target.value as any })}
                className="w-4 h-4" 
              />
              <span>RUN UP</span>
            </label>
          </div>

          <h3 className="font-semibold text-slate-900 mb-3 mt-4">Status:</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="status_genset" 
                value="Master" 
                checked={record?.status_master_slave === 'Master'}
                onChange={(e) => setRecord({ ...record!, status_master_slave: e.target.value as any })}
                className="w-4 h-4" 
              />
              <span>Master</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="status_genset" 
                value="Slave" 
                checked={record?.status_master_slave === 'Slave'}
                onChange={(e) => setRecord({ ...record!, status_master_slave: e.target.value as any })}
                className="w-4 h-4" 
              />
              <span>Slave</span>
            </label>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-20 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">MANAGER TEKNIK</p>
          </div>
          <div className="text-center">
            <div className="h-20 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">SUPERVISOR</p>
          </div>
          <div className="text-center">
            <div className="h-20 border-b border-slate-400 mb-2"></div>
            <p className="font-semibold text-sm">TEKNISI</p>
          </div>
        </div>
      </div>
    </div>
  );
};