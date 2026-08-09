<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Listado de clientes con búsqueda y paginación.
     */
    public function index(Request $request)
    {
        $query = Client::query();

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // withCount para traer el número total de citas
        return $this->success(
            $query->withCount('appointments')
                  ->orderByDesc('last_visit_at')
                  ->orderBy('name')
                  ->paginate(20)
        );
    }

    /**
     * Crear cliente manualmente.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $client = Client::create($request->all());

        return $this->success($client, 'Cliente creado exitosamente', 201);
    }

    /**
     * Ver perfil de cliente.
     */
    public function show(Client $client)
    {
        $this->authorize('view', $client);
        return $this->success($client->loadCount('appointments'));
    }

    /**
     * Actualizar datos del cliente.
     */
    public function update(Request $request, Client $client)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $this->authorize('update', $client);
        $client->update($request->all());

        return $this->success($client, 'Cliente actualizado');
    }

    /**
     * Eliminar un cliente.
     */
    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);
        $client->delete();
        return $this->success(null, 'Cliente eliminado');
    }

    /**
     * Obtener el historial de citas de un cliente.
     */
    public function appointments(Client $client)
    {
        $this->authorize('view', $client);
        $appointments = $client->appointments()
            ->with('service')
            ->orderByDesc('scheduled_at')
            ->get();

        return $this->success($appointments);
    }
}
