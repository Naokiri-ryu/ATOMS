export type Category = {
    id: number;
    name: string;
    items_count?: number;
    created_at: string;
    updated_at: string;
};

export type Item = {
    id: number;
    category_id: number;
    category?: Category;
    name: string;
    type: 'peralatan' | 'komponen' | 'asset';
    quantity: number;
    min_stock: number;
    available_quantity: number;
    is_low_stock: boolean;
    product_number: string | null;
    code_unique: string;
    serial_number: string | null;
    image_path: string | null;
    qr_code_path: string | null;
    created_at: string;
    updated_at: string;
};

export type Borrowing = {
    id: number;
    user_id: number;
    item_id: number;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    item?: Item;
    quantity: number;
    borrow_photo_path: string | null;
    return_photo_path: string | null;
    usage_notes: string | null;
    borrowed_at: string;
    returned_at: string | null;
    status: 'dipinjam' | 'dikembalikan' | 'digunakan';
    expected_return_time: string | null;
    is_overdue: boolean;
    created_at: string;
    updated_at: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

export type FlashMessages = {
    success: string | null;
    error: string | null;
};

export type BeritaAcara = {
    id: number;
    user_id: number;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    title: string;
    type: 'pemasangan' | 'pelepasan' | 'serah_terima';
    type_label: string;
    description: string | null;
    file_path: string;
    file_name: string;
    file_size: number;
    formatted_size: string;
    created_at: string;
    updated_at: string;
};

export type UserBasic = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export type Installation = {
    id: number;
    user_id: number;
    item_id: number;
    user?: UserBasic;
    item?: Item;
    approved_by_user?: UserBasic;
    quantity: number;
    notes: string | null;
    location: string | null;
    photo_path: string | null;
    status: 'menunggu_approval' | 'disetujui' | 'ditolak';
    status_label: string;
    approved_by: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    installed_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ItemHistory = {
    id: number;
    item_id: number;
    user_id: number | null;
    user?: UserBasic;
    action: 'dibuat' | 'diperbarui' | 'stok_bertambah' | 'stok_berkurang';
    action_label: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};
