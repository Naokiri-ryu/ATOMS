import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Clock,
    Download,
    History,
    Info,
    Package,
    Printer,
    QrCode,
    User
} from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Borrowing, Installation, Item, ItemHistory } from '@/types';

interface Props {
    item: Item;
    histories: ItemHistory[];
    borrowingHistory: Borrowing[];
    installationHistory: Installation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Barang', href: '/admin/items' },
    { title: 'Detail', href: '#' },
];

export default function ItemShow({ item, histories, borrowingHistory, installationHistory }: Props) {

    // Label field yang readable
    const fieldLabels: Record<string, string> = {
        name: 'Nama Barang',
        type: 'Jenis',
        quantity: 'Stok',
        min_stock: 'Minimum Stok',
        product_number: 'Product Number',
        serial_number: 'Serial Number',
        category_id: 'Kategori',
        notes: 'Catatan',
        location: 'Lokasi',
        status: 'Status',
    };

    // Tampilkan hanya field yang berubah
    const getChangedFields = (oldData: Record<string, any>, newData: Record<string, any>) => {
        const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
        return allKeys.filter((key) => {
            const oldVal = oldData[key] ?? null;
            const newVal = newData[key] ?? null;
            return String(oldVal) !== String(newVal);
        });
    };
    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=500');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${item.name}</title>
                <style>
                    body {
                        font-family: 'Inter', 'Segoe UI', sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        text-align: center;
                    }
                    .qr-container {
                        border: 3px solid #0284c7;
                        border-radius: 16px;
                        padding: 24px;
                        max-width: 300px;
                    }
                    .qr-container img {
                        width: 200px;
                        height: 200px;
                    }
                    .item-name {
                        font-size: 18px;
                        font-weight: 700;
                        margin: 12px 0 4px;
                        color: #0c4a6e;
                    }
                    .item-code {
                        font-family: monospace;
                        font-size: 14px;
                        color: #64748b;
                        margin: 4px 0;
                    }
                    .item-category {
                        font-size: 12px;
                        color: #94a3b8;
                    }
                    .brand {
                        margin-top: 12px;
                        font-size: 11px;
                        color: #cbd5e1;
                        letter-spacing: 1px;
                    }
                    @media print {
                        body { min-height: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img src="${window.location.origin}/storage/${item.qr_code_path}" alt="QR Code" />
                    <div class="item-name">${item.name}</div>
                    <div class="item-code">${item.code_unique}</div>
                    <div class="item-category">${item.category?.name || ''} · ${item.type}</div>
                    <div class="brand">SAKTI INVENTORY</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'dibuat': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'diperbarui': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'stok_bertambah': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'stok_berkurang': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={item.name} />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/items" className="rounded-lg p-2 transition-colors hover:bg-accent">
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{item.name}</h1>
                            <p className="text-sm text-muted-foreground font-mono">{item.code_unique}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/items/${item.id}/edit`}>Edit Barang</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="mb-4 w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1">
                                    Informasi Detail
                                </TabsTrigger>
                                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1">
                                    Histori Perubahan
                                </TabsTrigger>
                                <TabsTrigger value="logs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1">
                                    Log Aktivitas
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="space-y-4 mt-0">
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Info className="size-4 text-muted-foreground" />
                                            Spesifikasi Barang
                                        </h3>
                                        {item.is_low_stock && (
                                            <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full dark:bg-red-950/30 dark:text-red-400">
                                                <AlertTriangle className="size-3" /> STOK KRITIS
                                            </div>
                                        )}
                                    </div>
                                    <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                                        <div className="border-b pb-2 sm:col-span-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Barang</dt>
                                            <dd className="mt-1 font-semibold">{item.name}</dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kategori</dt>
                                            <dd className="mt-1 font-medium">{item.category?.name || '-'}</dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jenis</dt>
                                            <dd className="mt-1">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.type === 'peralatan' ? 'bg-blue-100 text-blue-700' :
                                                    item.type === 'komponen' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Number</dt>
                                            <dd className="mt-1 font-mono text-sm">{item.product_number || '-'}</dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serial Number</dt>
                                            <dd className="mt-1 font-mono text-sm">{item.serial_number || '-'}</dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Stok Sistem</dt>
                                            <dd className="mt-1 text-lg font-bold">{item.quantity} unit</dd>
                                        </div>
                                        <div className="border-b pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stok Tersedia (Riil)</dt>
                                            <dd className={`mt-1 text-lg font-black ${item.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.available_quantity} unit
                                            </dd>
                                        </div>
                                        <div className="pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minimum Stok</dt>
                                            <dd className="mt-1 font-medium">{item.min_stock} unit</dd>
                                        </div>
                                        <div className="pb-2">
                                            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Input</dt>
                                            <dd className="mt-1 text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString('id-ID')}</dd>
                                        </div>
                                    </dl>
                                </div>
                                {item.image_path && (
                                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                                        <h3 className="mb-4 font-semibold">Foto Visual</h3>
                                        <img src={`/storage/${item.image_path}`} alt={item.name} className="w-full rounded-lg object-contain max-h-[400px] bg-slate-50" />
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="mt-0">
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <h3 className="mb-6 font-semibold flex items-center gap-2">
                                        <History className="size-4 text-muted-foreground" />
                                        Log Perubahan Data (Permanen)
                                    </h3>
                                    {histories.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-10 text-center">Belum ada histori perubahan data.</p>
                                    ) : (
                                        <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-muted">
                                            {histories.map((h) => (
                                                <div key={h.id} className="relative pl-10">
                                                    <div className="absolute left-0 top-1 size-9 rounded-full bg-background border-2 border-muted flex items-center justify-center z-10 shadow-sm">
                                                        <User className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold">{h.user?.name || 'Sistem'}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getActionBadgeColor(h.action)}`}>
                                                                {h.action_label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                            <Calendar className="size-3" /> {new Date(h.created_at).toLocaleString('id-ID')}
                                                        </p>
                                                        {h.notes && <p className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md italic">"{h.notes}"</p>}
                                                        {h.action === 'diperbarui' && h.old_data && h.new_data && (() => {
                                                            const oldData = h.old_data;
                                                            const newData = h.new_data;
                                                            const changed = getChangedFields(oldData, newData);
                                                            if (changed.length === 0) return null;
                                                            return (
                                                                <div className="mt-2 overflow-x-auto rounded-lg border bg-slate-50 text-xs dark:bg-slate-900/50">
                                                                    <table className="min-w-[640px] w-full">
                                                                        <thead>
                                                                            <tr className="border-b bg-slate-100 dark:bg-slate-800/60">
                                                                                <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase tracking-tighter text-[10px] w-1/3">Field</th>
                                                                                <th className="px-3 py-1.5 text-left font-semibold text-red-600 uppercase tracking-tighter text-[10px] w-1/3">Sebelumnya</th>
                                                                                <th className="px-3 py-1.5 text-left font-semibold text-green-600 uppercase tracking-tighter text-[10px] w-1/3">Sesudahnya</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {changed.map((key) => (
                                                                                <tr key={key} className="border-b last:border-0">
                                                                                    <td className="px-3 py-1.5 font-medium text-muted-foreground">
                                                                                        {fieldLabels[key] ?? key}
                                                                                    </td>
                                                                                    <td className="px-3 py-1.5 text-red-600 font-mono">
                                                                                        {String(oldData[key] ?? '-')}
                                                                                    </td>
                                                                                    <td className="px-3 py-1.5 text-green-600 font-mono">
                                                                                        {String(newData[key] ?? '-')}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="logs" className="mt-0">
                                <div className="space-y-6">
                                    {item.type !== 'peralatan' && (
                                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                                            <h3 className="mb-4 font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                <Package className="size-4" />
                                                Histori Penggunaan (Pemasangan)
                                            </h3>
                                            {installationHistory.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-6">Belum ada histori pemasangan.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {installationHistory.map((log) => (
                                                        <div key={log.id} className="flex flex-col gap-2 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/20">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm">{log.user?.name}</span>
                                                                    <span className="text-xs text-muted-foreground">— Qty: {log.quantity}</span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.status === 'disetujui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {log.status_label}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs flex items-center gap-4 text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(log.created_at).toLocaleDateString('id-ID')}</span>
                                                                <span className="flex items-center gap-1">📍 {log.location || 'N/A'}</span>
                                                            </div>
                                                            {log.notes && <p className="text-xs italic bg-white p-2 rounded border dark:bg-black/20">Catatan: {log.notes}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.type === 'peralatan' && (
                                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                                            <h3 className="mb-4 font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                                <Clock className="size-4" />
                                                Histori Peminjaman (Alat)
                                            </h3>
                                            {borrowingHistory.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-6">Belum ada histori peminjaman.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {borrowingHistory.map((log) => (
                                                        <div key={log.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">{log.user?.name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                                    {new Date(log.borrowed_at).toLocaleString('id-ID')} —
                                                                    {log.returned_at ? ` Kembali: ${new Date(log.returned_at).toLocaleString('id-ID')}` : ' Belum Kembali'}
                                                                </span>
                                                            </div>
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${log.status === 'dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                {log.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-sm text-center">
                            <h3 className="mb-2 font-bold text-primary flex items-center justify-center gap-2">
                                <QrCode className="size-5" /> IDENTITAS QR
                            </h3>
                            <p className="mb-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                Sakti Inventory System
                            </p>
                            {item.qr_code_path ? (
                                <>
                                    <div className="mx-auto mb-4 inline-block rounded-xl border-4 border-slate-50 bg-white p-4 shadow-inner">
                                        <img src={`/storage/${item.qr_code_path}`} alt={`QR ${item.code_unique}`} className="size-40" />
                                    </div>
                                    <p className="mb-4 font-mono text-sm font-black text-slate-800 dark:text-slate-200">{item.code_unique}</p>

                                    <Button onClick={handlePrintQR} className="w-full gap-2 font-bold py-6">
                                        <Printer className="size-4" /> Cetak Label QR
                                    </Button>

                                    <a href={`/storage/${item.qr_code_path}`} download={`${item.code_unique}.svg`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border bg-slate-50 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400">
                                        <Download className="size-4" /> Download SVG File
                                    </a>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <QrCode className="size-16 text-muted-foreground/20" />
                                    <p className="text-sm text-muted-foreground">QR belum tersedia</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <h4 className="mb-3 text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <Info className="size-4" /> Alur Kerja {item.type}
                            </h4>
                            <ul className="space-y-3 text-xs text-blue-700/80 dark:text-blue-400/80">
                                {item.type === 'peralatan' ? (
                                    <>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                                            <span>Teknisi scan QR untuk peminjaman alat sementara.</span>
                                        </li>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                                            <span>Wajib foto bukti pengambilan alat.</span>
                                        </li>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                                            <span>Alat harus dikembalikan (stok akan kembali normal).</span>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                                            <span>Teknisi mengajukan pemasangan melalui scan QR.</span>
                                        </li>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                                            <span>Admin meninjau dan memberi persetujuan.</span>
                                        </li>
                                        <li className="flex gap-2 font-medium">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                                            <span>Setelah disetujui, stok berkurang secara permanen.</span>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
