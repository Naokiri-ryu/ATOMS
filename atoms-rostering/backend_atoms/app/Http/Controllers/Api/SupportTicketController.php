<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupportTicketRequest;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SupportTicketController extends Controller
{
    private function normalizeRole(?string $role): string
    {
        if (!$role) {
            return '';
        }

        $collapsed = preg_replace('/\s+/', ' ', trim($role));
        return mb_strtolower($collapsed ?? '');
    }

    private function isAdminOrManager(?string $role): bool
    {
        $normalizedRole = $this->normalizeRole($role);
        $adminManagerRoles = [
            $this->normalizeRole(User::ROLE_ADMIN),
            $this->normalizeRole(User::ROLE_MANAGER_TEKNIK),
            $this->normalizeRole(User::ROLE_GENERAL_MANAGER),
        ];

        return in_array($normalizedRole, $adminManagerRoles, true);
    }

    /**
     * POST /support-tickets
     * Create a new support ticket
     */
    public function store(StoreSupportTicketRequest $request)
    {
        $user = Auth::user();

        DB::beginTransaction();
        try {
            $data = [
                'user_id' => $user->id,
                'category' => $request->category,
                'title' => $request->title,
                'description' => $request->description,
                'status' => SupportTicket::STATUS_OPEN,
            ];

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('support-tickets', $filename, 'public');

                $data['attachment_path'] = $path;
                $data['attachment_original_name'] = $file->getClientOriginalName();
            }

            $ticket = SupportTicket::create($data);

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'create',
                'module' => 'support_ticket',
                'reference_id' => $ticket->id,
                'description' => 'Created support ticket - ' . $ticket->category_name . ': ' . $ticket->title,
            ]);

            DB::commit();

            $ticket->load(['user', 'responder']);

            return response()->json([
                'message' => 'Support ticket created successfully',
                'data' => $ticket,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            if (isset($data['attachment_path']) && Storage::disk('public')->exists($data['attachment_path'])) {
                Storage::disk('public')->delete($data['attachment_path']);
            }

            Log::error('[support_ticket][store] Failed to create support ticket', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to create support ticket',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /support-tickets/my-tickets
     * Get current user's support tickets
     */
    public function myTickets(Request $request)
    {
        $user = Auth::user();

        $query = SupportTicket::with(['user', 'responder'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $perPage = $request->get('per_page', 15);
        $tickets = $query->paginate($perPage);

        return response()->json([
            'message' => 'Your support tickets retrieved successfully',
            'data' => $tickets,
        ]);
    }

    /**
     * GET /support-tickets/{id}
     * Get support ticket detail
     */
    public function show($id)
    {
        $user = Auth::user();
        $ticket = SupportTicket::with(['user', 'responder'])->findOrFail($id);

        if ($ticket->user_id !== $user->id && !$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Unauthorized to view this support ticket',
            ], 403);
        }

        return response()->json([
            'message' => 'Support ticket retrieved successfully',
            'data' => $ticket,
        ]);
    }

    /**
     * PATCH /support-tickets/{id}/status
     * Update ticket status (Admin/Manager only)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if (!$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Only admins and managers can update ticket status',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $oldStatus = $ticket->status;

        $ticket->update([
            'status' => $validated['status'],
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'update_status',
            'module' => 'support_ticket',
            'reference_id' => $ticket->id,
            'description' => 'Updated support ticket status from ' . $oldStatus . ' to ' . $validated['status'],
        ]);

        $ticket->load(['user', 'responder']);

        return response()->json([
            'message' => 'Ticket status updated successfully',
            'data' => $ticket,
        ]);
    }

    /**
     * POST /support-tickets/{id}/respond
     * Admin/Manager response to a ticket
     */
    public function respond(Request $request, $id)
    {
        $user = Auth::user();

        if (!$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Only admins and managers can respond to tickets',
            ], 403);
        }

        $validated = $request->validate([
            'response' => 'required|string|max:5000',
        ]);

        $ticket = SupportTicket::findOrFail($id);

        DB::beginTransaction();
        try {
            $ticket->update([
                'admin_response' => $validated['response'],
                'responded_by' => $user->id,
                'responded_at' => now(),
                'status' => SupportTicket::STATUS_IN_PROGRESS,
            ]);

            Notification::create([
                'user_id' => $ticket->user_id,
                'sender_id' => $user->id,
                'title' => 'Support Ticket #' . $ticket->id . ' - Response',
                'message' => 'Your support ticket "' . $ticket->title . '" has received a response from ' . $user->name . '.',
                'type' => 'inbox',
                'category' => 'support_ticket',
                'data' => json_encode([
                    'support_ticket_id' => $ticket->id,
                ]),
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'respond',
                'module' => 'support_ticket',
                'reference_id' => $ticket->id,
                'description' => 'Responded to support ticket: ' . $ticket->title,
            ]);

            DB::commit();

            $ticket->load(['user', 'responder']);

            return response()->json([
                'message' => 'Response submitted successfully',
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('[support_ticket][respond] Failed to respond to support ticket', [
                'ticket_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to submit response',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /support-tickets/{id}
     * Soft delete a support ticket (owner only, if status is open)
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $ticket = SupportTicket::findOrFail($id);

        if ($ticket->user_id !== $user->id && !$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Unauthorized to delete this support ticket',
            ], 403);
        }

        if ($ticket->status !== SupportTicket::STATUS_OPEN && !$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Only open tickets can be deleted by the owner',
            ], 400);
        }

        DB::beginTransaction();
        try {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'delete',
                'module' => 'support_ticket',
                'reference_id' => $ticket->id,
                'description' => 'Deleted support ticket: ' . $ticket->title,
            ]);

            $ticket->delete();

            DB::commit();

            return response()->json([
                'message' => 'Support ticket deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete support ticket',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /support-tickets
     * Get all support tickets (Admin/Manager only)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Only admins and managers can view all tickets',
            ], 403);
        }

        $query = SupportTicket::with(['user', 'responder'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $tickets = $query->paginate($perPage);

        return response()->json([
            'message' => 'Support tickets retrieved successfully',
            'data' => $tickets,
        ]);
    }

    /**
     * GET /support-tickets/statistics
     * Get support ticket statistics (Admin/Manager only)
     */
    public function statistics()
    {
        $user = Auth::user();

        if (!$this->isAdminOrManager($user->role)) {
            return response()->json([
                'message' => 'Only admins and managers can view statistics',
            ], 403);
        }

        $stats = [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::open()->count(),
            'in_progress' => SupportTicket::byStatus(SupportTicket::STATUS_IN_PROGRESS)->count(),
            'resolved' => SupportTicket::byStatus(SupportTicket::STATUS_RESOLVED)->count(),
            'closed' => SupportTicket::byStatus(SupportTicket::STATUS_CLOSED)->count(),
            'by_category' => [
                'bug_report' => SupportTicket::byCategory(SupportTicket::CATEGORY_BUG_REPORT)->count(),
                'feature_request' => SupportTicket::byCategory(SupportTicket::CATEGORY_FEATURE_REQUEST)->count(),
            ],
        ];

        return response()->json([
            'message' => 'Statistics retrieved successfully',
            'data' => $stats,
        ]);
    }
}
