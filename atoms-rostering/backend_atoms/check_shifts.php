<?php
require __DIR__ . /vendor/autoload.php;
 = require __DIR__ . /bootstrap/app.php;
->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
foreach (App\Models\Shift::whereIn(name,[pagi,siang,malam])->orderBy(id)->get() as ) {
    echo ->name.:.->start_time.:.->end_time.\n;
}
