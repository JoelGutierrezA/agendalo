<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->unique()->constrained()->onDelete('cascade');
            $table->string('google_email')->nullable();
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->string('token_type')->nullable();
            $table->text('scope')->nullable();
            $table->string('calendar_id')->default('primary');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_integrations');
    }
};
