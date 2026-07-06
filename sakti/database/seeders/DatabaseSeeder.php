<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin user
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@sakti.local',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create Teknisi user
        User::create([
            'name' => 'Teknisi Demo',
            'email' => 'teknisi@sakti.local',
            'password' => bcrypt('password'),
            'role' => 'teknisi',
            'email_verified_at' => now(),
        ]);

        // Create Categories
        $categories = [
            'Alat Kelistrikan',
            'Komponen Elektronik',
            'Alat Ukur',
            'Peralatan Tangan',
        ];

        foreach ($categories as $categoryName) {
            Category::create(['name' => $categoryName]);
        }

        // Create sample Items
        $items = [
            ['name' => 'Multimeter Digital', 'category' => 'Alat Ukur', 'type' => 'peralatan', 'qty' => 5],
            ['name' => 'Tang Ampere', 'category' => 'Alat Ukur', 'type' => 'peralatan', 'qty' => 3],
            ['name' => 'Obeng Set', 'category' => 'Peralatan Tangan', 'type' => 'peralatan', 'qty' => 10],
            ['name' => 'Tang Kombinasi', 'category' => 'Peralatan Tangan', 'type' => 'peralatan', 'qty' => 8],
            ['name' => 'Kabel NYA 2.5mm', 'category' => 'Alat Kelistrikan', 'type' => 'komponen', 'qty' => 50],
            ['name' => 'MCB 16A', 'category' => 'Alat Kelistrikan', 'type' => 'komponen', 'qty' => 20],
            ['name' => 'Resistor 1K Ohm', 'category' => 'Komponen Elektronik', 'type' => 'komponen', 'qty' => 100],
            ['name' => 'Kapasitor 100uF', 'category' => 'Komponen Elektronik', 'type' => 'komponen', 'qty' => 50],
            ['name' => 'Solder Station', 'category' => 'Peralatan Tangan', 'type' => 'peralatan', 'qty' => 4],
            ['name' => 'Oscilloscope', 'category' => 'Alat Ukur', 'type' => 'peralatan', 'qty' => 2],
        ];

        foreach ($items as $itemData) {
            $category = Category::where('name', $itemData['category'])->first();
            Item::create([
                'category_id' => $category->id,
                'name' => $itemData['name'],
                'type' => $itemData['type'],
                'quantity' => $itemData['qty'],
            ]);
        }
    }
}
