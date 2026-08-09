<?php

namespace App\Policies;

use App\Models\Supply;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SupplyPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Supply $supply): bool
    {
        return $user->business_id === $supply->business_id || $user->role === 'admin_platform';
    }

    public function update(User $user, Supply $supply): bool
    {
        return $user->business_id === $supply->business_id;
    }

    public function delete(User $user, Supply $supply): bool
    {
        return $user->business_id === $supply->business_id;
    }
}
