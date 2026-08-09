<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
        ]);

        // Crear Admin de Plataforma de prueba
        User::create([
            'name' => 'Admin Agéndalo',
            'email' => 'admin@agendalo.app',
            'password' => Hash::make('admin123'),
            'role' => 'admin_platform',
        ]);
    }
}
