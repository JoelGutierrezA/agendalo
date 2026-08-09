<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    /**
     * Listado global de negocios.
     */
    public function businesses()
    {
        $businesses = Business::with('owner')->latest()->paginate(20);
        return $this->success($businesses);
    }

    /**
     * Listado global de usuarios.
     */
    public function users()
    {
        $users = User::latest()->paginate(30);
        return $this->success($users);
    }

    /**
     * Alternar estado de activación de un negocio.
     */
    public function toggleBusinessStatus(Business $business)
    {
        $business->update(['is_active' => !$business->is_active]);
        return $this->success($business, 'Estado del negocio actualizado');
    }

    /**
     * Alternar estado de activación de un usuario.
     */
    public function toggleUserStatus(User $user)
    {
        if ($user->role === 'admin_platform') {
            return $this->error('No puedes desactivar a un administrador de plataforma', 403);
        }

        $user->update(['is_active' => !$user->is_active]);
        return $this->success($user, 'Estado del usuario actualizado');
    }

    /**
     * Estadísticas globales para el dashboard de admin.
     */
    public function stats()
    {
        return $this->success([
            'total_businesses' => Business::count(),
            'total_users' => User::count(),
            'active_businesses' => Business::where('is_active', true)->count(),
            'total_appointments' => \App\Models\Appointment::count(),
        ]);
    }
}
