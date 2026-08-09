<?php

namespace App\Models;

use App\Traits\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseRecord extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'category_id',
        'description',
        'amount',
        'recorded_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'recorded_at' => 'date',
    ];

    /**
     * Categoría de egreso.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class);
    }
}
