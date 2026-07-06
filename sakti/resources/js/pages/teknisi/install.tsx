import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { 
    ArrowLeft, 
    ArrowRight, 
    Box, 
    Camera, 
    CheckCircle, 
    MapPin, 
    Package, 
    QrCode, 
    Type,
    Upload
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { QrScanner } from '@/components/qr-scanner';
import { WebcamCapture } from '@/components/webcam-capture';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Item } from '@/types';

interface Props {
    prefillItem?: Item;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pengajuan Pemasangan', href: '/teknisi/install' },
];

type Step = 'scan' | 'details' | 'photo' | 'confirm';

export default function InstallPage({ prefillItem }: Props) {
    const [step, setStep] = useState<Step>(prefillItem ? 'details' : 'scan');
    const [item, setItem] = useState<Item | null>(prefillItem || null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [photoMode, setPhotoMode] = useState<'camera' | 'upload'>('camera');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [quantity, setQuantity] = useState('1');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If prefillItem changes (from props), update state
    useEffect(() => {
        if (prefillItem) {
            setItem(prefillItem);
            setStep('details');
        }
    }, [prefillItem]);

    const handleScan = async (code: string) => {
        setError(null);
        try {
            const response = await axios.post('/teknisi/scan-item', { code });
            const scannedItem = response.data.item;

            if (!['komponen', 'asset'].includes(scannedItem.type)) {
                setError('Barang ini jenis Peralatan. Gunakan menu Peminjaman.');
                return;
            }

            setItem(scannedItem);
            setStep('details');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Barang tidak ditemukan.');
        }
    };

    const handlePhoto = (imageBase64: string) => {
        setPhoto(imageBase64);
        setStep('confirm');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setPhoto(result);
            setStep('confirm');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
        if (!item) return;
        setProcessing(true);

        router.post('/teknisi/install', {
            item_id: item.id,
            quantity: Number(quantity || '1'),
            location,
            notes,
            photo,
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengajuan Pemasangan" />
            <FlashMessage />

            <div className="p-4 sm:p-6">
                <div className="mx-auto w-full max-w-lg">
                    {/* Step indicator */}
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                        {[
                            { key: 'scan', label: 'Scan', icon: QrCode },
                            { key: 'details', label: 'Detail', icon: MapPin },
                            { key: 'photo', label: 'Foto', icon: Camera },
                            { key: 'confirm', label: 'Review', icon: CheckCircle },
                        ].map((s, i) => (
                            <div key={s.key} className="flex items-center">
                                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:px-3 ${step === s.key
                                        ? 'bg-primary text-primary-foreground'
                                        : (['scan', 'details', 'photo', 'confirm'].indexOf(step) > i)
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <s.icon className="size-3" />
                                    {s.label}
                                </div>
                                {i < 3 && <ArrowRight className="mx-1 size-3 text-muted-foreground" />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Scan QR */}
                    {step === 'scan' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <QrCode className="size-5 text-primary" />
                                    Scan Barang (Komponen/Asset)
                                </h2>
                                <QrScanner onScan={handleScan} active />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 'details' && item && (
                        <div className="space-y-4">
                            {/* Item Info */}
                            <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                                <Box className="size-8 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {item.category?.name} · Stok: {item.available_quantity}
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                    item.type === 'asset' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                    {item.type}
                                </span>
                            </div>

                            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
                                        <Package className="size-4 text-muted-foreground" />
                                        Jumlah Digunakan
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
                                        onBlur={() => {
                                            const parsed = Number(quantity || '1');
                                            setQuantity(String(Math.min(Math.max(parsed, 1), item.available_quantity)));
                                        }}
                                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
                                        <MapPin className="size-4 text-muted-foreground" />
                                        Lokasi Pemasangan
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Misal: Gedung A Lt. 2, Ruang Server"
                                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
                                        <Type className="size-4 text-muted-foreground" />
                                        Catatan / Keperluan
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Detail pekerjaan..."
                                        rows={3}
                                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => setStep('scan')}
                                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                                >
                                    Scan Ulang
                                </button>
                                <button
                                    onClick={() => setStep('photo')}
                                    disabled={!location}
                                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Lanjut ke Foto
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Photo */}
                    {step === 'photo' && item && (
                        <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <Camera className="size-5 text-primary" />
                                    Foto Dokumentasi
                                </h2>
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Ambil foto atau upload gambar sebagai bukti pemasangan.
                                </p>

                                {/* Toggle kamera / upload */}
                                <div className="mb-4 flex rounded-lg border overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setPhotoMode('camera')}
                                        className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${photoMode === 'camera' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        <Camera className="size-4" /> Kamera
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPhotoMode('upload')}
                                        className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${photoMode === 'upload' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        <Upload className="size-4" /> Upload
                                    </button>
                                </div>

                                {photoMode === 'camera' ? (
                                    <WebcamCapture onCapture={handlePhoto} facingMode="environment" />
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-10 transition-colors hover:border-primary/50 hover:bg-muted/40"
                                    >
                                        <Upload className="size-10 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">Klik untuk pilih foto dari galeri</p>
                                        <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setStep('details')}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-3" /> Kembali ke detail
                            </button>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {step === 'confirm' && item && photo && (
                        <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-600">
                                    <CheckCircle className="size-5" />
                                    Review Pengajuan
                                </h2>

                                <dl className="space-y-3 text-sm">
                                    <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Barang</dt>
                                        <dd className="break-words font-bold sm:text-right">{item.name}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Jumlah</dt>
                                        <dd className="font-bold text-lg">{quantity || '1'}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Lokasi</dt>
                                        <dd className="break-words font-medium text-primary sm:text-right">{location}</dd>
                                    </div>
                                    <div className="flex flex-col border-b pb-2">
                                        <dt className="text-muted-foreground mb-1">Catatan</dt>
                                        <dd className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-xs">{notes || '-'}</dd>
                                    </div>
                                </dl>

                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-medium">Preview Foto:</p>
                                    <img src={photo} alt="Preview" className="w-full rounded-lg border shadow-inner" />
                                </div>

                                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900/50">
                                    <p className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 mb-1">Penting</p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                        Stok akan langsung berkurang setelah admin menyetujui pengajuan ini.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => setStep('photo')}
                                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                                >
                                    Foto Ulang
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-green-700 disabled:opacity-50 shadow-md shadow-green-200 dark:shadow-none"
                                >
                                    {processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
