<!DOCTYPE html>
<html lang="id">

@php
    $nomorBeritaAcara = \App\Models\BeritaAcara::completeNomor($nomor_ba ?? '', $type ?? 'pemasangan');
@endphp

<head>
    <meta charset="utf-8">
    <title>{{ $nomorBeritaAcara }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            padding: 24px 40px;
        }

        /* ===== HEADER ===== */
        .header-wrap {
            width: 100%;
            margin-bottom: 18px;
        }

        .header-left {
            float: left;
        }

        .header-left img {
            display: inline-block;
            vertical-align: middle;
            width: 72px;
            height: auto;
        }

        .header-left .company-name {
            display: inline-block;
            vertical-align: middle;
            font-size: 15pt;
            font-weight: bold;
            white-space: nowrap;
            padding-left: 8px;
        }

        .header-right {
            float: right;
            text-align: right;
            font-size: 9pt;
            line-height: 1.5;
        }

        .header-right .bold {
            font-weight: bold;
        }

        .clearfix::after {
            content: '';
            display: table;
            clear: both;
        }

        /* ===== TITLE ===== */
        .doc-title {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-decoration: underline;
            margin: 18px 0 4px;
        }

        .doc-nomor {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 18px;
        }

        /* ===== BODY ===== */
        .opening {
            text-align: justify;
            margin-bottom: 14px;
            font-size: 11pt;
        }

        /* ===== TABLE BARANG ===== */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 10pt;
        }

        .items-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 5px 7px;
            text-align: center;
            font-weight: bold;
        }

        .items-table td {
            border: 1px solid #000;
            padding: 5px 7px;
            vertical-align: top;
        }

        .items-table td.center {
            text-align: center;
        }

        /* ===== SIGNATURE ===== */
        .sig-img-wrap {
            height: 90px;
            display: block;
            text-align: center;
        }

        .sig-img-wrap img {
            max-height: 80px;
            max-width: 160px;
            width: auto;
            height: auto;
            margin-top: 10px;
        }

        .sig-pending-text {
            font-size: 8pt;
            color: #aaa;
            font-style: italic;
            display: block;
            padding-top: 50px;
        }

        .sig-name {
            font-weight: bold;
            text-decoration: underline;
            font-size: 11pt;
            margin-top: 4px;
        }

        .sig-position {
            font-size: 9pt;
            margin-top: 2px;
        }

        /* ===== LAMPIRAN ===== */
        .lampiran {
            margin-top: 24px;
            border-top: 1px solid #000;
            padding-top: 10px;
            font-size: 10pt;
        }

        .lampiran-title {
            font-weight: bold;
            margin-bottom: 6px;
        }

        .lampiran table {
            border-collapse: collapse;
        }

        .lampiran td {
            padding: 2px 0;
            vertical-align: top;
        }

        .lampiran td:first-child {
            width: 130px;
        }

        .lampiran .foto-wrap {
            margin-top: 10px;
        }

        .lampiran .foto-wrap img {
            max-width: 320px;
            max-height: 240px;
            border: 1px solid #ccc;
            display: block;
        }
    </style>
</head>

<body>

    {{-- ===== HEADER ===== --}}
    <div class="header-wrap clearfix">
        <div class="header-left">
            @if(!empty($logo_path) && file_exists($logo_path))
                <img src="{{ $logo_path }}" alt="AirNav Indonesia">
            @else
                <div style="width:72px;height:72px;border:2px solid #003087;border-radius:50%;display:inline-block;vertical-align:middle;font-size:7pt;font-weight:bold;color:#003087;text-align:center;line-height:72px;">
                    AirNav
                </div>
            @endif
            <span class="company-name">AirNav Indonesia</span>
        </div>
        <div class="header-right">
            <div class="bold">Perum LPPNPI</div>
            <div class="bold">Kantor Cabang Surabaya</div>
            <div>Gedung AOB - Bandara Juanda,</div>
            <div>Surabaya - 61253</div>
            <div>Telp. (031) 2986515</div>
            <div>sekgmsub.airnav@gmail.com</div>
            <div>www.airnavindonesia.co.id</div>
        </div>
    </div>

    {{-- ===== JUDUL ===== --}}
    <div class="doc-title">Berita Acara {{ $type_label }} Barang</div>
    <div class="doc-nomor">Nomor : &nbsp; {{ $nomorBeritaAcara }}</div>

    {{-- ===== PARAGRAF PEMBUKA ===== --}}
    <p class="opening">
        Pada hari ini <strong>{{ $hari }}</strong> tanggal <strong>{{ $tanggal_huruf }}</strong>
        bulan <strong>{{ $bulan_huruf }}</strong> tahun <strong>{{ $tahun_huruf }}</strong>
        , menerangkan bahwa telah dilaksanakan
        <strong>{{ strtolower($type_label) }}</strong>
        @if(!empty($description)) {{ $description }}, @endif
        dengan rincian sebagai berikut:
    </p>

    {{-- ===== TABEL BARANG ===== --}}
    @if($type === 'pemasangan')
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:5%">No.</th>
                    <th style="width:22%">Nama Barang</th>
                    <th style="width:18%">Merk/Type</th>
                    <th style="width:15%">Serial Number</th>
                    <th style="width:18%">Lokasi Pemasangan</th>
                    <th style="width:8%">Jumlah</th>
                    <th style="width:14%">Keterangan</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="center">1.</td>
                    <td>{{ $item_name }}</td>
                    <td>{{ $item_merk ?? '-' }}</td>
                    <td>{{ $item_serial ?? '-' }}</td>
                    <td>{{ $location ?? '-' }}</td>
                    <td class="center">{{ $quantity }} Unit</td>
                    <td>{{ $item_keterangan ?? 'Normal Operasi' }}</td>
                </tr>
            </tbody>
        </table>
    @elseif($type === 'pelepasan')
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:5%">No.</th>
                    <th style="width:28%">Nama Barang</th>
                    <th style="width:12%">Nomor Aset</th>
                    <th style="width:8%">Jumlah</th>
                    <th style="width:15%">Merk/Type</th>
                    <th style="width:16%">Lokasi Awal</th>
                    <th style="width:16%">Lokasi Saat Ini</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="center">1.</td>
                    <td>{{ $item_name }}</td>
                    <td>{{ $item_code }}</td>
                    <td class="center">{{ $quantity }} Unit</td>
                    <td>{{ $item_merk ?? '-' }}</td>
                    <td>{{ $location ?? '-' }}</td>
                    <td>{{ $location_now ?? 'Ruangan Depo Sparepart' }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:5%">No.</th>
                    <th style="width:30%">Nama Barang</th>
                    <th style="width:20%">Part Number / Serial Number</th>
                    <th style="width:15%">Merk</th>
                    <th style="width:10%">Jumlah</th>
                    <th style="width:20%">Keterangan</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="center">1.</td>
                    <td>{{ $item_name }}</td>
                    <td>{{ $item_serial ?? ($item_code ?? '-') }}</td>
                    <td>{{ $item_merk ?? '-' }}</td>
                    <td class="center">{{ $quantity }} Unit</td>
                    <td>{{ $item_keterangan ?? 'Kondisi Baik' }}</td>
                </tr>
            </tbody>
        </table>
    @endif

    {{-- ===== TANDA TANGAN ===== --}}

    @php
        $signers = $signers_data ?? [];
        $signerRows = array_chunk($signers, 2);
        $tanggalSidoarjo = 'Sidoarjo, ' . now()->day . ' ' . $bulan_huruf . ' ' . now()->year;
    @endphp

    @if($type === 'serah_terima')
        {{-- Serah terima: Manager kiri, Teknisi kanan --}}
        {{-- Tanggal masuk sebagai baris pertama kolom kanan --}}
        <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-top:20px;">
            <tr>
                <td style="width:50%; border:none;">&nbsp;</td>
                <td style="width:50%; border:none; text-align:center; font-size:10pt; padding-bottom:8px;">
                    {{ $tanggalSidoarjo }}
                </td>
            </tr>
            <tr>
                <td style="width:50%; vertical-align:bottom; text-align:center; padding:0 10px 0 0; border:none;">
                    <div style="font-size:10pt; margin-bottom:2px;">Diterima oleh :</div>
                    <div style="font-size:9pt; color:#444; margin-bottom:6px;">{{ $manager_title ?? 'Manager Fasilitas Teknik' }}</div>
                    <div class="sig-img-wrap">
                        @if(!empty($manager_signature_path) && file_exists($manager_signature_path))
                            <img src="{{ $manager_signature_path }}" alt="TTD Manager">
                        @else
                            <span class="sig-pending-text">TTD menyusul</span>
                        @endif
                    </div>
                    <div class="sig-name">{{ $manager_name ?? '___________________' }}</div>
                    <div class="sig-position">{{ $manager_title ?? 'Manager Fasilitas Teknik' }}</div>
                </td>
                <td style="width:50%; vertical-align:bottom; text-align:center; padding:0 0 0 10px; border:none;">
                    <div style="font-size:10pt; margin-bottom:2px;">Diserahkan oleh :</div>
                    <div class="sig-img-wrap">
                        @if(!empty($signers[0]['signature_path']) && file_exists($signers[0]['signature_path']))
                            <img src="{{ $signers[0]['signature_path'] }}" alt="TTD Teknisi">
                        @else
                            <span class="sig-pending-text">&nbsp;</span>
                        @endif
                    </div>
                    <div class="sig-name">{{ $signers[0]['name'] ?? $signer_name }}</div>
                    <div class="sig-position">{{ $signers[0]['title'] ?? 'Teknisi Telekomunikasi Penerbangan' }}</div>
                </td>
            </tr>
        </table>

    @else
        {{-- Pemasangan / Pelepasan --}}
        {{-- Tanggal masuk sebagai baris pertama kolom kanan di dalam tabel TTD --}}
        <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-top:20px;">

            {{-- BARIS PERTAMA: kosong kiri | tanggal kanan --}}
            <tr>
                <td style="width:50%; border:none;">&nbsp;</td>
                <td style="width:50%; border:none; text-align:center; font-size:10pt; padding-bottom:8px;">
                    {{ $tanggalSidoarjo }}
                </td>
            </tr>

            @foreach($signerRows as $rowIndex => $rowTeknisi)
                <tr>
                    {{-- Kolom kiri: teknisi berdampingan --}}
                    <td style="width:50%; vertical-align:bottom; padding:{{ $rowIndex > 0 ? '20px' : '0' }} 10px 0 0; border:none;">
                        @if($rowIndex === 0)
                            <div style="font-size:10pt; text-align:center; margin-bottom:2px;">Teknisi Telekomunikasi Penerbangan</div>
                        @endif
                        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                            <tr>
                                @foreach($rowTeknisi as $tek)
                                    <td style="width:50%; vertical-align:bottom; text-align:center; border:none; padding:0 4px;">
                                        <div class="sig-img-wrap">
                                            @if(!empty($tek['signature_path']) && file_exists($tek['signature_path']))
                                                <img src="{{ $tek['signature_path'] }}" alt="TTD">
                                            @else
                                                <span class="sig-pending-text">&nbsp;</span>
                                            @endif
                                        </div>
                                        <div class="sig-name" style="font-size:10pt;">{{ $tek['name'] }}</div>
                                        <div class="sig-position">{{ $tek['title'] }}</div>
                                    </td>
                                @endforeach
                                @if(count($rowTeknisi) === 1)
                                    <td style="width:50%; border:none;">&nbsp;</td>
                                @endif
                            </tr>
                        </table>
                    </td>

                    {{-- Kolom kanan: manager hanya di baris pertama --}}
                    @if($rowIndex === 0)
                        <td style="width:50%; vertical-align:bottom; text-align:center; padding:0 0 0 10px; border:none;">
                            <div style="font-size:10pt; margin-bottom:2px;">Mengetahui,</div>
                            <div style="font-size:9pt; color:#444; margin-bottom:6px;">{{ $manager_title ?? 'MANAGER TEKNIK' }}</div>
                            <div class="sig-img-wrap">
                                @if(!empty($manager_signature_path) && file_exists($manager_signature_path))
                                    <img src="{{ $manager_signature_path }}" alt="TTD Manager">
                                @else
                                    <span class="sig-pending-text">TTD menyusul</span>
                                @endif
                            </div>
                            <div class="sig-name">{{ $manager_name ?? '___________________' }}</div>
                            <div class="sig-position">{{ $manager_title ?? 'MANAGER TEKNIK' }}</div>
                        </td>
                    @else
                        <td style="width:50%; border:none;">&nbsp;</td>
                    @endif
                </tr>
            @endforeach
        </table>
    @endif

    {{-- ===== LAMPIRAN ===== --}}
    <div class="lampiran" style="page-break-before: always;">
        <div class="lampiran-title">Lampiran Dokumentasi {{ $type_label }} Barang</div>
        <table>
            <tr>
                <td>Nama Barang</td>
                <td>: {{ $item_name }}</td>
            </tr>
            <tr>
                <td>Waktu</td>
                <td>: {{ $hari }}, {{ $tanggal_angka }}</td>
            </tr>
        </table>
        @if(!empty($photo_path) && file_exists($photo_path))
            <div class="foto-wrap">
                <img src="{{ $photo_path }}" alt="Foto Dokumentasi">
            </div>
        @endif
    </div>

</body>

</html>
