<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ClientPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Client $client): bool
    {
        return $user->business_id === $client->business_id || $user->role === 'admin_platform';
    }

    public function update(User $user, Client $client): bool
    {
        return $user->business_id === $client->business_id;
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->business_id === $client->business_id;
    }
}
