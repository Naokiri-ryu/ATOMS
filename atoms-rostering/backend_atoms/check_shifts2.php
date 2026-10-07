<?php
require 'vendor/autoload.php';
 = require 'bootstrap/app.php';
->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
foreach (App\Models\Shift::whereIn('name',['pagi','siang','malam'])->orderBy('id')->get() as ) {
  echo ->name . ':' . ->start_time . ':' . ->end_time . PHP_EOL;
}
