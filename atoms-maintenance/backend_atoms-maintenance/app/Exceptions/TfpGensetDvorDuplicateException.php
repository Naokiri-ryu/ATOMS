<?php

namespace App\Exceptions;

use App\Models\Tfp\TfpGensetDvorRecord;
use RuntimeException;

/**
 * Thrown when a TFP Genset DVOR record already exists for the same
 * (form_type, date, shift_type) tuple.
 *
 * The existing record is attached so the controller can return it inside the
 * 409 response body (frontend uses it to navigate to the existing detail page
 * instead of forcing the user to search for it again).
 */
class TfpGensetDvorDuplicateException extends RuntimeException
{
    public function __construct(
        public readonly TfpGensetDvorRecord $existingRecord,
        string $message = '',
    ) {
        if ($message === '') {
            $message = sprintf(
                'Form %s untuk tanggal %s shift %s sudah ada (No. %s).',
                $existingRecord->form_type,
                $existingRecord->date?->format('Y-m-d') ?? '',
                $existingRecord->shift_type,
                $existingRecord->form_number,
            );
        }
        parent::__construct($message);
    }
}