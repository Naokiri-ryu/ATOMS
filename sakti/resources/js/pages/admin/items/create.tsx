import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

interface Props {
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Barang', href: '/admin/items' },
    { title: 'Tambah Barang', href: '/admin/items/create' },
];

export default function ItemCreate({ categories }: Props) {
    const [form, setForm] = useState({
        name: '',
        category_id: '',
        type: 'peralatan' as 'peralatan' | 'komponen' | 'asset',
        quantity: '1',
        min_stock: '5',
        serial_number: '',
        product_number: '',
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('category_id', form.category_id);
        formData.append('type', form.type);
        formData.append('quantity', form.quantity || '0');
        formData.append('min_stock', form.min_stock || '0');
        formData.append('product_number', form.product_number);
        if (form.serial_number) {
            formData.append('serial_number', form.serial_number);
        }
        if (image) formData.append('image', image);

        router.post('/admin/items', formData, {
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Barang" />
            <FlashMessage />

            <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="rounded-lg p-2 transition-colors hover:bg-accent"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Tambah Barang Baru</h1>
                            <p className="text-sm text-muted-foreground">QR Code akan di-generate otomatis</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                        {/* Name */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Nama Barang</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="contoh: Multimeter Digital"
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Product Number */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Product Number (Part Number)</label>
                                <input
                                    type="text"
                                    value={form.product_number}
                                    onChange={(e) => setForm({ ...form, product_number: e.target.value })}
                                    placeholder="contoh: PN-99228-A"
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {errors.product_number && <p className="mt-1 text-xs text-red-500">{errors.product_number}</p>}
                            </div>

                            {/* Serial Number */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Nomor Serial
                                    <span className="ml-1 text-xs text-muted-foreground">(Opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.serial_number}
                                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                    placeholder="contoh: SN-2024-001234"
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {errors.serial_number && <p className="mt-1 text-xs text-red-500">{errors.serial_number}</p>}
                            </div>
                        </div>

                        {/* Category & Type */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Kategori</label>
                                <select
                                    value={form.category_id}
                                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Jenis Alur Kerja</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as 'peralatan' | 'komponen' | 'asset' })}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="peralatan">Peralatan (Flow Pinjam-Balik)</option>
                                    <option value="komponen">Komponen (Flow Pemasangan - Approval)</option>
                                    <option value="asset">Asset (Flow Pemasangan - Approval)</option>
                                </select>
                            </div>
                        </div>

                        {/* Stock Management */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Jumlah Stok Awal</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value.replace(/\D/g, '') })}
                                    onBlur={() => setForm((current) => ({ ...current, quantity: current.quantity || '0' }))}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                                {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-amber-600">Threshold Stok Minimum</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.min_stock}
                                    onChange={(e) => setForm({ ...form, min_stock: e.target.value.replace(/\D/g, '') })}
                                    onBlur={() => setForm((current) => ({ ...current, min_stock: current.min_stock || '1' }))}
                                    className="w-full rounded-lg border border-amber-200 bg-amber-50/20 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    required
                                />
                                {errors.min_stock && <p className="mt-1 text-xs text-red-500">{errors.min_stock}</p>}
                                <p className="mt-1 text-[10px] text-muted-foreground">Sistem akan memberi peringatan jika stok di bawah angka ini.</p>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Foto Barang (opsional)</label>
                            <div className="flex items-center gap-4">
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="size-20 rounded-lg border object-cover" />
                                )}
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                    <Upload className="size-4" />
                                    Pilih Gambar
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end border-t pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Barang'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
