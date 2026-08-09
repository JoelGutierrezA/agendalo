<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'booking_advance_days',
        'min_booking_notice_hours',
        'allow_public_booking',
        'booking_confirmation_required',
        'send_client_calendar_invite',
        'time_zone',
        'currency',
    ];

    protected $casts = [
        'allow_public_booking' => 'boolean',
        'booking_confirmation_required' => 'boolean',
        'send_client_calendar_invite' => 'boolean',
    ];
}
