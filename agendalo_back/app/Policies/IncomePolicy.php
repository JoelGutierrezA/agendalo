<?php

namespace App\Policies;

use App\Models\IncomeRecord;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IncomePolicy
{
    use HandlesAuthorization;

    public function view(User $user, IncomeRecord $record): bool
    {
        return $user->business_id === $record->business_id || $user->role === 'admin_platform';
    }

    public function update(User $user, IncomeRecord $record): bool
    {
        return $user->business_id === $record->business_id;
    }

    public function delete(User $user, IncomeRecord $record): bool
    {
        return $user->business_id === $record->business_id;
    }
}
