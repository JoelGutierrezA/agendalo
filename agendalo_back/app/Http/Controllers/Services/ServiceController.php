<?php

namespace App\Http\Controllers\Services;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * Listar todos los servicios del negocio autenticado.
     */
    public function index(Request $request)
    {
        $services = Service::orderBy('name')->get();
        return $this->success($services);
    }

    /**
     * Crear un nuevo servicio.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'price'            => 'required|numeric|min:0',
            'is_active'        => 'boolean',
        ]);

        $service = Service::create([
            'name'             => $request->name,
            'description'      => $request->description,
            'duration_minutes' => $request->duration_minutes,
            'price'            => $request->price,
            'is_active'        => $request->boolean('is_active', true),
        ]);

        return $this->success($service, 'Servicio creado exitosamente', 201);
    }

    /**
     * Mostrar un servicio específico.
     */
    public function show(Service $service)
    {
        $this->authorize('view', $service);
        return $this->success($service);
    }

    /**
     * Actualizar un servicio.
     */
    public function update(Request $request, Service $service)
    {
        $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'sometimes|required|integer|min:5|max:480',
            'price'            => 'sometimes|required|numeric|min:0',
            'is_active'        => 'boolean',
        ]);

        $this->authorize('update', $service);

        $service->update($request->only([
            'name', 'description', 'duration_minutes', 'price', 'is_active',
        ]));

        return $this->success($service->fresh(), 'Servicio actualizado correctamente');
    }

    /**
     * Eliminar un servicio.
     */
    public function destroy(Service $service)
    {
        $this->authorize('delete', $service);
        $service->delete();
        return $this->success(null, 'Servicio eliminado');
    }

    /**
     * Activar o desactivar un servicio rápidamente.
     */
    public function toggleActive(Service $service)
    {
        $this->authorize('update', $service);
        $service->update(['is_active' => !$service->is_active]);
        $status = $service->is_active ? 'activado' : 'desactivado';
        return $this->success($service->fresh(), "Servicio {$status}");
    }
}
