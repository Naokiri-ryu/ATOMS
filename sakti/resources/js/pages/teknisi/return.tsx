import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Box, Camera, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { WebcamCapture } from '@/components/webcam-capture';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Borrowing } from '@/types';

interface Props {
    borrowing: Borrowing;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kembalikan Barang', href: '#' },
];

export default function ReturnPage({ borrowing }: Props) {
    const [photo, setPhoto] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState<'photo' | 'confirm'>('photo');

    const handlePhoto = (imageBase64: string) => {
        setPhoto(imageBase64);
        setStep('confirm');
    };

    const handleSubmit = () => {
        if (!photo) return;
        setProcessing(true);

        router.post(`/teknisi/return/${borrowing.id}`, {
            return_photo: photo,
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kembalikan Barang" />
            <FlashMessage />

            <div className="p-4 sm:p-6">
                <div className="mx-auto w-full max-w-lg">
                    {/* Header */}
                    <div className="mb-6 flex min-w-0 items-center gap-3">
                        <button onClick={() => window.history.back()} className="rounded-lg p-2 hover:bg-accent">
                            <ArrowLeft className="size-5" />
                        </button>
                        <h1 className="min-w-0 break-words text-xl font-bold sm:text-2xl">Kembalikan Barang</h1>
                    </div>

                    {/* Item Info */}
                    <div className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                        <Box className="size-8 shrink-0 text-primary" />
                        <div className="min-w-0">
                            <h3 className="font-semibold">{borrowing.item?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {borrowing.item?.category?.name} · Jumlah: {borrowing.quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Dipinjam: {new Date(borrowing.borrowed_at).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* Step 1: Photo */}
                    {step === 'photo' && (
                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Camera className="size-5 text-primary" />
                                Foto Kondisi Barang
                            </h2>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Ambil foto kondisi barang saat dikembalikan.
                            </p>
                            <WebcamCapture onCapture={handlePhoto} facingMode="environment" />
                        </div>
                    )}

                    {/* Step 2: Confirm */}
                    {step === 'confirm' && photo && (
                        <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <CheckCircle className="size-5 text-green-600" />
                                    Konfirmasi Pengembalian
                                </h2>

                                <dl className="space-y-2 text-sm">
                                    <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Barang</dt>
                                        <dd className="break-words font-medium sm:text-right">{borrowing.item?.name}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Jumlah</dt>
                                        <dd>{borrowing.quantity}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                                        <dt className="text-muted-foreground">Durasi Pinjam</dt>
                                        <dd>
                                            {Math.round(
                                                (new Date().getTime() - new Date(borrowing.borrowed_at).getTime()) / (1000 * 60 * 60)
                                            )} jam
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-medium">Foto Kondisi:</p>
                                    <img src={photo} alt="Kondisi barang" className="w-full rounded-lg border" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => setStep('photo')}
                                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                                >
                                    Foto Ulang
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {processing ? 'Memproses...' : 'Konfirmasi Kembali'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
