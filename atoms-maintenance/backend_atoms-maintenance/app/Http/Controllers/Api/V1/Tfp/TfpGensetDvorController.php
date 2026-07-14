<?php

namespace App\Http\Controllers;

use App\Models\TfpGensetDvorRecord;
use App\Models\TfpGensetDvorItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TfpGensetDvorController extends Controller
{
    public function index()
    {
        $records = TfpGensetDvorRecord::with(['managerTeknik', 'supervisor', 'technicians'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return response()->json($records);
    }

    public function show($id)
    {
        $record = TfpGensetDvorRecord::with(['items', 'managerTeknik', 'supervisor', 'technicians'])
            ->findOrFail($id);
        
        return response()->json($record);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $record = TfpGensetDvorRecord::create([
                'form_number' => 'TFP-GENSET-DVOR-' . time(),
                'tanggal' => $request->tanggal,
                'shift' => $request->shift,
                'jam' => $request->jam,
                'engine' => $request->engine,
                'alternator' => $request->alternator,
                'kapasitas' => $request->kapasitas,
                'manager_teknik_id' => $request->manager_teknik_id,
                'supervisor_id' => $request->supervisor_id,
                'status' => 'draft',
            ]);

            // Create items
            if ($request->has('items')) {
                foreach ($request->items as $itemData) {
                    TfpGensetDvorItem::create([
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
            $record = TfpGensetDvorRecord::findOrFail($id);
            
            $record->update([
                'tanggal' => $request->tanggal ?? $record->tanggal,
                'shift' => $request->shift ?? $record->shift,
                'jam' => $request->jam ?? $record->jam,
                'engine' => $request->engine ?? $record->engine,
                'alternator' => $request->alternator ?? $record->alternator,
                'kapasitas' => $request->kapasitas ?? $record->kapasitas,
                'manager_teknik_id' => $request->manager_teknik_id ?? $record->manager_teknik_id,
                'supervisor_id' => $request->supervisor_id ?? $record->supervisor_id,
                'status' => $request->status ?? $record->status,
            ]);

            // Update items
            if ($request->has('items')) {
                foreach ($request->items as $itemData) {
                    TfpGensetDvorItem::updateOrCreate(
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
            $record = TfpGensetDvorRecord::findOrFail($id);
            $record->delete();
            
            return response()->json(['message' => 'Record deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete record', 'error' => $e->getMessage()], 500);
        }
    }

    public function addTechnician(Request $request, $recordId)
    {
        try {
            $record = TfpGensetDvorRecord::findOrFail($recordId);
            $record->technicians()->attach($request->technician_id);
            
            return response()->json($record->load('technicians'));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to add technician', 'error' => $e->getMessage()], 500);
        }
    }

    public function removeTechnician($recordId, $technicianId)
    {
        try {
            $record = TfpGensetDvorRecord::findOrFail($recordId);
            $record->technicians()->detach($technicianId);
            
            return response()->json($record->load('technicians'));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to remove technician', 'error' => $e->getMessage()], 500);
        }
    }
}