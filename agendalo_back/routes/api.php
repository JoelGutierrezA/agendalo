<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Business\BusinessController;
use App\Http\Controllers\Appointments\AppointmentController;
use App\Http\Controllers\Clients\ClientController;
use App\Http\Controllers\Services\ServiceController;
use App\Http\Controllers\Finance\IncomeController;
use App\Http\Controllers\Finance\ExpenseController;
use App\Http\Controllers\Finance\ExpenseCategoryController;
use App\Http\Controllers\Settings\SettingsController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\PublicBooking\PublicBookingController;
use App\Http\Controllers\GoogleCalendar\GoogleCalendarController;
use App\Http\Controllers\Admin\PlatformController;

// ============================================================
// API Health Check
// ============================================================
Route::get('/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()]));

// ============================================================
// Rutas Públicas (sin autenticación)
// ============================================================
Route::prefix('public')->name('public.')->group(function () {
    // Página pública del negocio y reservas
    Route::get('business/{slug}',                  [PublicBookingController::class, 'show'])->name('business.show');
    Route::get('business/{slug}/services',         [PublicBookingController::class, 'services'])->name('business.services');
    Route::get('business/{slug}/availability',     [PublicBookingController::class, 'availability'])->name('business.availability');
    Route::post('business/{slug}/book',            [PublicBookingController::class, 'book'])->name('business.book');
    Route::get('appointments/{id}/confirmation',   [PublicBookingController::class, 'confirmation'])->name('appointment.confirmation');
});

// ============================================================
// Autenticación
// ============================================================
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register',         [AuthController::class, 'register'])->name('register');
    Route::post('login',            [AuthController::class, 'login'])->name('login');
    Route::post('forgot-password',  [PasswordResetController::class, 'sendResetLink'])->name('forgot-password');
    Route::post('reset-password',   [PasswordResetController::class, 'reset'])->name('reset-password');

    // Rutas autenticadas
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout'])->name('logout');
        Route::get('me',       [AuthController::class, 'me'])->name('me');
    });
});

// ============================================================
// Rutas Privadas (requieren autenticación)
// ============================================================
Route::middleware(['auth:sanctum', 'ensure.active'])->group(function () {

    // --- Negocio -----------------------------------------------
    Route::prefix('business')->name('business.')->group(function () {
        Route::get('/',            [BusinessController::class, 'show'])->name('show');
        Route::post('/',           [BusinessController::class, 'store'])->name('store');
        Route::put('/',            [BusinessController::class, 'update'])->name('update');
        Route::get('categories',   [BusinessController::class, 'categories'])->name('categories');
        Route::post('check-slug',  [BusinessController::class, 'checkSlug'])->name('check-slug');
    });

    // --- Servicios ---------------------------------------------
    Route::apiResource('services', ServiceController::class);
    Route::patch('services/{service}/toggle-active', [ServiceController::class, 'toggleActive'])->name('services.toggle-active');

    // --- Clientes ----------------------------------------------
    Route::apiResource('clients', ClientController::class);
    Route::get('clients/{client}/appointments', [ClientController::class, 'appointments'])->name('clients.appointments');

    // --- Citas -------------------------------------------------
    Route::get('appointments/calendar', [AppointmentController::class, 'calendar'])->name('appointments.calendar');
    Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status');
    Route::apiResource('appointments', AppointmentController::class);

    // --- Finanzas — Ingresos -----------------------------------
    Route::apiResource('finance/income', IncomeController::class)->names([
        'index'   => 'income.index',
        'store'   => 'income.store',
        'show'    => 'income.show',
        'update'  => 'income.update',
        'destroy' => 'income.destroy',
    ]);

    // --- Finanzas — Egresos ------------------------------------
    Route::apiResource('finance/expenses', ExpenseController::class)->names([
        'index'   => 'expense.index',
        'store'   => 'expense.store',
        'show'    => 'expense.show',
        'update'  => 'expense.update',
        'destroy' => 'expense.destroy',
    ]);
    Route::apiResource('finance/expense-categories', ExpenseCategoryController::class)->only(['index', 'store', 'update', 'destroy']);

    // --- Finanzas — Insumos e Inventario -----------------------
    Route::prefix('finance/supplies')->name('finance.supplies.')->group(function () {
        Route::get('catalog', [\App\Http\Controllers\Finance\SupplyController::class, 'getCatalog'])->name('catalog');
        Route::post('catalog', [\App\Http\Controllers\Finance\SupplyController::class, 'storeCatalogItem'])->name('store_catalog');
        Route::get('purchases', [\App\Http\Controllers\Finance\SupplyController::class, 'indexPurchases'])->name('purchases.index');
        Route::post('purchases', [\App\Http\Controllers\Finance\SupplyController::class, 'storePurchase'])->name('purchases.store');
        Route::delete('purchases/{id}', [\App\Http\Controllers\Finance\SupplyController::class, 'destroyPurchase'])->name('purchases.destroy');
    });

    // --- Dashboard ---------------------------------------------
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('summary',            [DashboardController::class, 'summary'])->name('summary');
        Route::get('appointments-chart', [DashboardController::class, 'appointmentsChart'])->name('appointments-chart');
        Route::get('finance-chart',      [DashboardController::class, 'financeChart'])->name('finance-chart');
    });

    // --- Configuración -----------------------------------------
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/',               [SettingsController::class, 'show'])->name('show');
        Route::put('/',               [SettingsController::class, 'update'])->name('update');
        Route::get('opening-hours',   [SettingsController::class, 'openingHours'])->name('opening-hours');
        Route::put('opening-hours',   [SettingsController::class, 'updateOpeningHours'])->name('opening-hours.update');
    });

    // --- Google Calendar (placeholder — Fase 2) ----------------
    Route::prefix('google')->name('google.')->group(function () {
        Route::get('auth-url',    [GoogleCalendarController::class, 'authUrl'])->name('auth-url');
        Route::get('status',      [GoogleCalendarController::class, 'status'])->name('status');
        Route::delete('disconnect',[GoogleCalendarController::class, 'disconnect'])->name('disconnect');
    });

    // --- Admin de Plataforma (Gestión Global) ------------------
    Route::prefix('admin/platform')->name('admin.platform.')->middleware('admin')->group(function () {
        Route::get('stats',                    [PlatformController::class, 'stats'])->name('stats');
        Route::get('businesses',               [PlatformController::class, 'businesses'])->name('businesses');
        Route::get('users',                    [PlatformController::class, 'users'])->name('users');
        Route::patch('businesses/{business}/toggle-status', [PlatformController::class, 'toggleBusinessStatus'])->name('businesses.toggle');
        Route::patch('users/{user}/toggle-status',           [PlatformController::class, 'toggleUserStatus'])->name('users.toggle');
    });
});

// Google Calendar OAuth callback (no requiere auth:sanctum — viene de Google)
Route::get('google/callback', [GoogleCalendarController::class, 'callback'])->name('google.callback');
