<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Category;
use App\Models\OpeningHour;
use App\Models\BusinessSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessController extends Controller
{
    /**
     * Mostrar los datos del negocio del usuario.
     */
    public function show(Request $request)
    {
        $business = $request->user()->business()->with(['category', 'settings', 'openingHours'])->first();
        
        if (!$business) {
            return $this->error('No tienes un negocio configurado', 404);
        }

        return $this->success($business);
    }

    /**
     * Crear el negocio (onboarding).
     */
    public function store(Request $request)
    {
        if ($request->user()->business_id) {
            return $this->error('Ya tienes un negocio configurado', 400);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:businesses,slug|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            $user = $request->user();

            $business = Business::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'slug' => Str::slug($request->slug),
                'category_id' => $request->category_id,
                'phone' => $request->phone,
                'email' => $request->email,
                'description' => $request->description,
                'address' => $request->address,
            ]);

            // Actualizar el user con el id del negocio para acceso rápido
            $user->update(['business_id' => $business->id]);

            // Crear config por defecto
            BusinessSetting::create(['business_id' => $business->id]);

            // Crear horarios por defecto (L-V 09:00 - 18:00)
            for ($i = 0; $i < 7; $i++) {
                OpeningHour::create([
                    'business_id' => $business->id,
                    'day_of_week' => $i,
                    'is_open' => ($i > 0 && $i < 6), // Lunes a Viernes
                    'open_time' => '09:00',
                    'close_time' => '18:00',
                ]);
            }

            return $this->success($business->load(['settings', 'openingHours']), 'Negocio creado exitosamente', 201);
        });
    }

    /**
     * Actualizar datos del negocio.
     */
    public function update(Request $request)
    {
        $user     = $request->user();
        $business = $user->business;

        if (!$business) {
            return $this->error('No tienes un negocio configurado', 404);
        }

        $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'slug'        => 'sometimes|required|string|max:255|unique:businesses,slug,' . $business->id,
            'category_id' => 'nullable|exists:categories,id',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'address'     => 'nullable|string|max:255',
            'city'        => 'nullable|string|max:100',
            'country'     => 'nullable|string|max:100',
        ]);

        $updateData = $request->only([
            'name', 'slug', 'category_id', 'phone',
            'email', 'description', 'address', 'city', 'country',
        ]);

        if (isset($updateData['slug'])) {
            $updateData['slug'] = Str::slug($updateData['slug']);
        }

        $business->update($updateData);

        return $this->success(
            $business->fresh()->load(['category', 'settings', 'openingHours']),
            'Negocio actualizado correctamente'
        );
    }

    /**
     * Listar categorías de negocios.
     */
    public function categories()
    {
        return $this->success(Category::all());
    }

    /**
     * Verificar si un slug está disponible.
     */
    public function checkSlug(Request $request)
    {
        $request->validate(['slug' => 'required|string']);
        $exists = Business::where('slug', Str::slug($request->slug))->exists();
        
        return $this->success(['available' => !$exists]);
    }
}

