<?php

namespace App\Support;

use App\Services\RosteringIntegrationService;
use Carbon\Carbon;

class ShiftClock
{
    public function getDefaultEndTimes(): array
    {
        return [
            pagi  => 13:15,
            siang => 19:15,
            malam => 07:15,
        ];
    }

    public function getShiftEndTime(string , ?string  = null): ?string
    {
        try {
             = app(RosteringIntegrationService::class);
             = ->getShiftTimes(, );
            if (!empty([end_time])) {
                return substr([end_time], 0, 5);
            }
        } catch (\Throwable ) {
        }

         = config(shift_windows, [
            pagi  => [start => 07:15, end => 13:15],
            siang => [start => 13:15, end => 19:15],
            malam => [start => 19:15, end => 07:15],
        ]);

         = [][end] ?? null;
        if () {
            return ;
        }

        return ->getDefaultEndTimes()[] ?? 13:15;
    }

    public function isShiftEnded(string , ?string  = null): bool
    {
         = now();

        try {
             = app(RosteringIntegrationService::class);
            return ->isShiftEnded(, );
        } catch (\Throwable ) {
        }

         = ->getShiftEndTime(, );
         =  ? Carbon::parse() : ->copy()->startOfDay();

        if (strtolower() === malam &&  < 12:00) {
             = ->copy()->addDay();
        }

         = ->copy()->setTimeFromTimeString();

        return ->greaterThanOrEqualTo();
    }
}
