<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServicePolicy
{
    use HandlesAuthorization;

    public function view(User $user, Service $service): bool
    {
        return $user->business_id === $service->business_id || $user->role === 'admin_platform';
    }

    public function update(User $user, Service $service): bool
    {
        return $user->business_id === $service->business_id;
    }

    public function delete(User $user, Service $service): bool
    {
        return $user->business_id === $service->business_id;
    }
}
