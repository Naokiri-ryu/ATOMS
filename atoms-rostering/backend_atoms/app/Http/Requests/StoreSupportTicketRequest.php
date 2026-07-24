<?php

namespace App\Http\Requests;

use App\Models\SupportTicket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => [
                'required',
                Rule::in([
                    SupportTicket::CATEGORY_BUG_REPORT,
                    SupportTicket::CATEGORY_FEATURE_REQUEST,
                ]),
            ],
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,gif,pdf,doc,docx|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'category.required' => 'Kategori wajib dipilih',
            'category.in' => 'Kategori tidak valid',
            'title.required' => 'Judul wajib diisi',
            'title.max' => 'Judul maksimal 255 karakter',
            'description.required' => 'Deskripsi wajib diisi',
            'description.max' => 'Deskripsi maksimal 5000 karakter',
            'attachment.file' => 'Lampiran harus berupa file',
            'attachment.mimes' => 'Lampiran harus berformat JPG, PNG, GIF, PDF, DOC, atau DOCX',
            'attachment.max' => 'Ukuran lampiran maksimal 5MB',
        ];
    }

    public function attributes(): array
    {
        return [
            'category' => 'kategori',
            'title' => 'judul',
            'description' => 'deskripsi',
            'attachment' => 'lampiran',
        ];
    }
}
