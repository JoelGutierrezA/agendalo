<?php

namespace App\Models;

use App\Traits\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplyTransaction extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'supply_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'purchased_at',
        'notes',
        'expense_record_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'purchased_at' => 'date',
    ];

    /**
     * Relación con el Insumo base.
     */
    public function supply(): BelongsTo
    {
        return $this->belongsTo(Supply::class);
    }

    /**
     * Enlace al registro contable de egreso en Finanzas.
     */
    public function expenseRecord(): BelongsTo
    {
        return $this->belongsTo(ExpenseRecord::class);
    }
}
