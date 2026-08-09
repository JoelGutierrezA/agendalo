<?php

namespace App\Policies;

use App\Models\ExpenseRecord;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpensePolicy
{
    use HandlesAuthorization;

    public function view(User $user, ExpenseRecord $record): bool
    {
        return $user->business_id === $record->business_id || $user->role === 'admin_platform';
    }

    public function update(User $user, ExpenseRecord $record): bool
    {
        return $user->business_id === $record->business_id;
    }

    public function delete(User $user, ExpenseRecord $record): bool
    {
        return $user->business_id === $record->business_id;
    }
}
