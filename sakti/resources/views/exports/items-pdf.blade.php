<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Data Barang - SAKTI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #0284c7;
        }
        .header h1 {
            font-size: 22px;
            color: #0284c7;
            margin-bottom: 4px;
        }
        .header p {
            font-size: 12px;
            color: #64748b;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 10px;
            color: #64748b;
        }
        .meta span { display: inline-block; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #0284c7;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th.center, td.center { text-align: center; }
        td {
            padding: 7px 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        tr:hover { background-color: #f1f5f9; }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
        }
        .badge-peralatan { background: #dbeafe; color: #1d4ed8; }
        .badge-komponen { background: #f3e8ff; color: #7c3aed; }
        .badge-asset { background: #fef3c7; color: #b45309; }
        .stock-ok { color: #16a34a; font-weight: 700; }
        .stock-empty { color: #dc2626; font-weight: 700; }
        .stock-borrowed { color: #d97706; font-weight: 600; }
        .code { font-family: 'Courier New', monospace; font-size: 10px; color: #475569; }
        .footer {
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .summary {
            margin-bottom: 15px;
            padding: 10px 15px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            display: table;
            width: 100%;
        }
        .summary-item {
            display: table-cell;
            text-align: center;
            padding: 0 10px;
        }
        .summary-item .value {
            font-size: 18px;
            font-weight: 700;
            color: #0284c7;
        }
        .summary-item .label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $exportTitle ?? 'SAKTI — Data Inventaris Barang' }}</h1>
        <p>{{ $exportSubtitle ?? 'Sistem Aplikasi Kesiapan Teknisi & Inventaris' }}</p>
    </div>

    <div class="meta">
        <span>Dicetak: {{ $generatedAt }}</span>
        <span>Total: {{ $items->count() }} barang</span>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="value">{{ $items->count() }}</div>
            <div class="label">Total Item</div>
        </div>
        <div class="summary-item">
            <div class="value">{{ $items->sum('quantity') }}</div>
            <div class="label">Total Stok</div>
        </div>
        <div class="summary-item">
            <div class="value">{{ $items->sum('available_quantity') }}</div>
            <div class="label">Tersedia</div>
        </div>
        <div class="summary-item">
            <div class="value">{{ $items->sum('borrowed_count') }}</div>
            <div class="label">Dipinjam</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="center">No</th>
                <th>Nama Barang</th>
                <th>Kode Unik</th>
                <th>Kategori</th>
                <th class="center">Jenis</th>
                <th class="center">Total Stok</th>
                <th class="center">Tersedia</th>
                <th class="center">Dipinjam</th>
                <th>Tgl Dibuat</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $index => $item)
            <tr>
                <td class="center">{{ $index + 1 }}</td>
                <td><strong>{{ $item->name }}</strong></td>
                <td class="code">{{ $item->code_unique }}</td>
                <td>{{ $item->category?->name ?? '-' }}</td>
                <td class="center">
                    <span class="badge {{ $item->type === 'peralatan' ? 'badge-peralatan' : ($item->type === 'asset' ? 'badge-asset' : 'badge-komponen') }}">
                        {{ $item->type === 'peralatan' ? 'Peralatan' : ($item->type === 'asset' ? 'Asset' : 'Komponen') }}
                    </span>
                </td>
                <td class="center"><strong>{{ $item->quantity }}</strong></td>
                <td class="center {{ $item->available_quantity > 0 ? 'stock-ok' : 'stock-empty' }}">
                    {{ $item->available_quantity }}
                </td>
                <td class="center {{ $item->borrowed_count > 0 ? 'stock-borrowed' : '' }}">
                    {{ $item->borrowed_count }}
                </td>
                <td>{{ $item->created_at->format('d/m/Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        SAKTI — Sistem Aplikasi Kesiapan Teknisi & Inventaris &bull; Dokumen ini digenerate secara otomatis
    </div>
</body>
</html>
