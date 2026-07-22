import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpGensetDvorService } from '@/services/tfpGensetDvorService';
import type { TfpGensetDvorRecordDetail } from '@/types/tfpGensetDvor';

// ─── Helpers ──────────────────────────────────────────────────

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '' : v);

const STATUS_OPERASI_LABEL: Record<string, string> = {
  PLN_OFF: 'PLN OFF',
  RUN_UP: 'RUN UP',
};

/**
 * TFP Performance Check Genset DVOR — Print View (A4 portrait)
 *
 * Reproduces the paper form layout directly (two stacked tables — checklist
 * rows 1-16, then parameter readings 17-33 with group_label sub-headers —
 * followed by Catatan / Status Operasi / Status / Level BBM, then the
 * Manager Teknik / Supervisor / Teknisi signature footer).
 *
 * Print does NOT auto-fire — user clicks Print PDF button.
 */
export const TfpGensetDvorPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpGensetDvorRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await tfpGensetDvorService.getRecord(Number(id));
        if (!cancelled) setRecord(data);
      } catch {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchRecord();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Form tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/tfp/dvor-genset')}>
          Kembali
        </Button>
      </div>
    );
  }

  const facilities = record.facilities;
  const items = record.items;

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { background: white !important; }
          .print-hide { display: none !important; }
          .sig-footer { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/tfp/dvor-genset/${record.id}`)}>
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* A4 portrait paper */}
      <div className="mx-auto max-w-[210mm] bg-white font-sans text-[10px] print:mx-0 print:w-full print:max-w-none">
        {/* Kop */}
        <div className="grid grid-cols-[30%_40%_30%] items-center mb-2 px-2 pt-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="text-[11px] font-black leading-tight">AirNav Indonesia</div>
          </div>
          <div className="text-center">
            <div className="text-[12px] font-black leading-tight">
              PERFORMANCE CHECK GENSET DVOR TEKNIK FASILITAS PENUNJANG
            </div>
            <div className="text-[10px] font-bold leading-tight">AIRNAV CABANG SURABAYA</div>
          </div>
          <div className="text-right text-[9px] font-bold leading-tight">
            <div>{record.form_number}</div>
          </div>
        </div>

        {/* Engine / Alternator / Kapasitas */}
        <div className="px-2 mb-2 text-[10px] leading-tight">
          <div className="grid grid-cols-[110px_1fr]">
            <span className="font-bold">ENGINE</span>
            <span>: Yanmar</span>
          </div>
          <div className="grid grid-cols-[110px_1fr]">
            <span className="font-bold">ALTERNATOR</span>
            <span>: Stamford</span>
          </div>
          <div className="grid grid-cols-[110px_1fr]">
            <span className="font-bold">KAPASITAS</span>
            <span>: 20 KVA</span>
          </div>
        </div>

        {/* Hari/Tanggal/Shift/Jam */}
        <table className="w-full border-collapse text-[9px] mb-2">
          <tbody>
            <tr className="bg-blue-50">
              <td className="border border-black px-2 py-1 font-bold w-[15%]">Hari / Tanggal</td>
              <td className="border border-black px-2 py-1 w-[35%]">
                {record.day_name ?? ''} / {formatDate(record.date)}
              </td>
              <td className="border border-black px-2 py-1 font-bold w-[15%]">Shift</td>
              <td className="border border-black px-2 py-1 w-[15%] capitalize">{record.shift_type}</td>
              <td className="border border-black px-2 py-1 font-bold w-[8%]">Jam</td>
              <td className="border border-black px-2 py-1">{record.time_filled ?? ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Table 1: Uraian Pekerjaan (rows 1-16) */}
        <table className="w-full border-collapse text-[9px] mb-2" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24px' }} />
            <col />
            <col style={{ width: '46px' }} />
            <col style={{ width: '46px' }} />
            <col style={{ width: '150px' }} />
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th rowSpan={2} className="border border-black px-1 py-1 font-bold">No</th>
              <th rowSpan={2} className="border border-black px-1 py-1 font-bold">Uraian Pekerjaan</th>
              <th colSpan={2} className="border border-black px-1 py-0.5 font-bold">Kondisi</th>
              <th rowSpan={2} className="border border-black px-1 py-1 font-bold">Keterangan</th>
            </tr>
            <tr className="bg-blue-50">
              <th className="border border-black px-1 py-0.5 font-semibold text-[8px]">Baik</th>
              <th className="border border-black px-1 py-0.5 font-semibold text-[8px]">Tidak Baik</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f, idx) => (
              <tr key={f.id}>
                <td className="border border-black px-1 py-0.5 text-center">{idx + 1}</td>
                <td className="border border-black px-1 py-0.5">{f.facility_name}</td>
                <td className="border border-black px-1 py-0.5 text-center">{f.kondisi === 'Baik' ? '√' : ''}</td>
                <td className="border border-black px-1 py-0.5 text-center">
                  {f.kondisi === 'Tidak Baik' ? '√' : ''}
                </td>
                <td className="border border-black px-1 py-0.5">{val(f.keterangan)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table 2: Parameter Pengukuran (rows 17-33) */}
        <table className="w-full border-collapse text-[9px] mb-2" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24px' }} />
            <col />
            <col style={{ width: '70px' }} />
            <col style={{ width: '46px' }} />
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-black px-1 py-1 font-bold">No</th>
              <th className="border border-black px-1 py-1 font-bold">Parameter</th>
              <th className="border border-black px-1 py-1 font-bold">Nilai</th>
              <th className="border border-black px-1 py-1 font-bold">Satuan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const showGroupHeader = it.group_label && (idx === 0 || items[idx - 1].group_label !== it.group_label);
              const value = it.values?.['value.value'] ?? '';
              return (
                <React.Fragment key={it.id}>
                  {showGroupHeader && (
                    <tr className="bg-blue-50">
                      <td className="border border-black px-1 py-0.5 text-center font-bold">
                        {it.parameter_number}
                      </td>
                      <td colSpan={3} className="border border-black px-1 py-0.5 font-bold italic">
                        {it.group_label}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="border border-black px-1 py-0.5 text-center">
                      {it.group_label ? '' : it.parameter_number}
                    </td>
                    <td className="border border-black px-1 py-0.5" style={{ paddingLeft: it.group_label ? '14px' : undefined }}>
                      {it.parameter_name}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">{val(value)}</td>
                    <td className="border border-black px-1 py-0.5 text-center">{val(it.unit)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Catatan + Status */}
        <table className="w-full border-collapse text-[9px] mb-2">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold align-top w-[20%]">Catatan</td>
              <td className="border border-black px-2 py-1 align-top" style={{ minHeight: '40px' }}>
                {val(record.catatan) || <span className="text-slate-400 italic">—</span>}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Status Operasi</td>
              <td className="border border-black px-2 py-1">
                {(['PLN_OFF', 'RUN_UP'] as const).map((opt) => (
                  <span key={opt} className="inline-flex items-center gap-1 mr-4">
                    <span className="inline-block h-3 w-3 rounded-full border border-black text-center leading-[10px]">
                      {record.status_operasi === opt ? '●' : ''}
                    </span>
                    {STATUS_OPERASI_LABEL[opt]}
                  </span>
                ))}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Status</td>
              <td className="border border-black px-2 py-1">
                {(['Master', 'Slave'] as const).map((opt) => (
                  <span key={opt} className="inline-flex items-center gap-1 mr-4">
                    <span className="inline-block h-3 w-3 rounded-full border border-black text-center leading-[10px]">
                      {record.status_master_slave === opt ? '●' : ''}
                    </span>
                    {opt}
                  </span>
                ))}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Level BBM</td>
              <td className="border border-black px-2 py-1">{val(record.fuel_level) || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature footer */}
        <div className="sig-footer mt-0 border border-black">
          <div className="flex">
            <div className="flex w-[26%] flex-col items-center border-r border-black px-2 py-1.5 text-center">
              <div className="text-[10px] font-black uppercase">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full">
                {record.manager ? (
                  record.manager.signature ? (
                    <img
                      src={record.manager.signature}
                      alt="TTD Manager Teknik"
                      className="max-h-10 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-10 w-24 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[8px] text-gray-400 italic">Manager Teknik tidak ditugaskan</span>
                )}
              </div>
              <div className="text-[9px] font-semibold leading-tight">{record.manager?.name ?? '—'}</div>
            </div>

            <div className="flex w-[26%] flex-col items-center border-r border-black px-2 py-1.5 text-center">
              <div className="text-[10px] font-black uppercase">Supervisor</div>
              <div className="flex flex-1 items-center justify-center w-full">
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img
                      src={record.supervisor.signature}
                      alt="TTD Supervisor"
                      className="max-h-10 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-10 w-24 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[8px] text-gray-400 italic">Tidak ada supervisor pada shift ini</span>
                )}
              </div>
              <div className="text-[9px] font-semibold leading-tight">{record.supervisor?.name ?? '—'}</div>
            </div>

            <div className="flex-1 px-2 py-1.5">
              <div className="text-[10px] font-black text-center uppercase mb-1">Teknisi / Paraf</div>
              {record.technicians.length > 0 ? (
                <div className="grid grid-cols-1 gap-y-0.5">
                  {record.technicians.map((tech, idx) => (
                    <div key={tech.id} className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 w-3 shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="text-[9px] font-semibold truncate leading-tight">
                          {tech.technician_name}
                        </div>
                        <div className="h-7 flex items-center">
                          {tech.signature ? (
                            <img
                              src={tech.signature}
                              alt={`TTD ${tech.technician_name}`}
                              className="max-h-6 max-w-[80px] object-contain"
                            />
                          ) : (
                            <span className="text-[8px] text-gray-400 italic">( &nbsp;&nbsp; )</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[9px] text-gray-400 py-2">Tidak ada teknisi</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-0.5 flex justify-between text-[8px] text-slate-700 px-1 pb-2">
          <span>(*) Coret yang tidak perlu</span>
          <span>Kondisi : (√) Baik / Normal</span>
        </div>
      </div>
    </div>
  );
};