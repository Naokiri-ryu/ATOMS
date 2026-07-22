<?php

namespace App\Http\Controllers\Api\V1\Tfp;

use App\Http\Controllers\Controller;
use App\Models\Tfp\TfpGensetRadarRecord;
use App\Models\Tfp\TfpGensetRadarItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TfpGensetRadarController extends Controller
{
    public function index()
    {
        $records = TfpGensetRadarRecord::with(['managerTeknik', 'supervisor', 'technicians'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return response()->json($records);
    }

    public function show($id)
    {
        $record = TfpGensetRadarRecord::with(['items', 'managerTeknik', 'supervisor', 'technicians'])
            ->findOrFail($id);
        
        return response()->json($record);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $record = TfpGensetRadarRecord::create([
                'form_number' => 'TFP-GENSET-RADAR-' . time(),
                'tanggal' => $request->tanggal,
                'shift' => $request->shift,
                'jam' => $request->jam,
                'engine' => $request->engine,
                'alternator' => $request->alternator,
                'kapasitas' => $request->kapasitas,
                'status_operasi' => $request->status_operasi,
                'status_master_slave' => $request->status_master_slave,
                'status' => 'draft',
                'manager_teknik_id' => $request->manager_teknik_id,
                'supervisor_id' => $request->supervisor_id,
            ]);

            if ($request->has('items')) {
                foreach ($request->items as $itemData) {
                    TfpGensetRadarItem::create([
                        'record_id' => $record->id,
                        'nomor' => $itemData['nomor'],
                        'uraian_pekerjaan' => $itemData['uraian_pekerjaan'],
                        'kondisi_baik' => $itemData['kondisi_baik'] ?? false,
                        'kondisi_tidak_baik' => $itemData['kondisi_tidak_baik'] ?? false,
                        'keterangan' => $itemData['keterangan'] ?? null,
                        'satuan' => $itemData['satuan'] ?? null,
                        'nilai' => $itemData['nilai'] ?? null,
                    ]);
                }
            }

            DB::commit();
            
            return response()->json($record->load(['items', 'managerTeknik', 'supervisor', 'technicians']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create record', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        
        try {
            $record = TfpGensetRadarRecord::findOrFail($id);
            
            $record->update([
                'tanggal' => $request->tanggal ?? $record->tanggal,
                'shift' => $request->shift ?? $record->shift,
                'jam' => $request->jam ?? $record->jam,
                'engine' => $request->engine ?? $record->engine,
                'alternator' => $request->alternator ?? $record->alternator,
                'kapasitas' => $request->kapasitas ?? $record->kapasitas,
                'status_operasi' => $request->status_operasi ?? $record->status_operasi,
                'status_master_slave' => $request->status_master_slave ?? $record->status_master_slave,
                'status' => $request->status ?? $record->status,
                'manager_teknik_id' => $request->manager_teknik_id ?? $record->manager_teknik_id,
                'supervisor_id' => $request->supervisor_id ?? $record->supervisor_id,
            ]);

            if ($request->has('items')) {
                foreach ($request->items as $itemData) {
                    TfpGensetRadarItem::updateOrCreate(
                        ['record_id' => $record->id, 'nomor' => $itemData['nomor']],
                        [
                            'uraian_pekerjaan' => $itemData['uraian_pekerjaan'],
                            'kondisi_baik' => $itemData['kondisi_baik'] ?? false,
                            'kondisi_tidak_baik' => $itemData['kondisi_tidak_baik'] ?? false,
                            'keterangan' => $itemData['keterangan'] ?? null,
                            'satuan' => $itemData['satuan'] ?? null,
                            'nilai' => $itemData['nilai'] ?? null,
                        ]
                    );
                }
            }

            DB::commit();
            
            return response()->json($record->load(['items', 'managerTeknik', 'supervisor', 'technicians']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update record', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $record = TfpGensetRadarRecord::findOrFail($id);
            $record->delete();
            
            return response()->json(['message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete record', 'error' => $e->getMessage()], 500);
        }
    }
}
