<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Barbería y Peluquería', 'icon' => '✂️'],
            ['name' => 'Salud y Medicina', 'icon' => '🩺'],
            ['name' => 'Deportes y Gimnasio', 'icon' => '🏋️'],
            ['name' => 'Asesoría y Consultoría', 'icon' => '💼'],
            ['name' => 'Estética y Spa', 'icon' => '💅'],
            ['name' => 'Educación y Clases', 'icon' => '📚'],
            ['name' => 'Otros', 'icon' => '✨'],
        ];

        foreach ($categories as $cat) {
            Category::create([
                'name' => $cat['name'],
                'slug' => Str::slug($cat['name']),
                'icon' => $cat['icon'],
            ]);
        }
    }
}
