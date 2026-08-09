<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AppointmentPolicy
{
    use HandlesAuthorization;

    /**
     * Determinar si el usuario puede ver la cita.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->business_id === $appointment->business_id || $user->role === 'admin_platform';
    }

    /**
     * Determinar si el usuario puede actualizar la cita.
     */
    public function update(User $user, Appointment $appointment): bool
    {
        return $user->business_id === $appointment->business_id;
    }

    /**
     * Determinar si el usuario puede eliminar la cita.
     */
    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->business_id === $appointment->business_id;
    }
}
