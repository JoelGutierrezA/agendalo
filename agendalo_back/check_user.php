<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::where('email', 'admin@agendalo.com')->first();
if ($user) {
    echo "USER_FOUND: " . $user->email . "\n";
    echo "ROLE: " . $user->role . "\n";
} else {
    echo "USER_NOT_FOUND\n";
    // Let's list all users to see what's there
    $users = User::all();
    echo "TOTAL_USERS: " . $users->count() . "\n";
    foreach ($users as $u) {
        echo "- " . $u->email . " (" . $u->role . ")\n";
    }
}
