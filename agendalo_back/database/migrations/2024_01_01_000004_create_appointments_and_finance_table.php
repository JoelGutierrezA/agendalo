<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('service_id')->nullable()->constrained()->onDelete('set null');
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->timestamp('scheduled_at');
            $table->integer('duration_minutes');
            $table->string('status')->default('pending'); // pending, confirmed, completed, cancelled, no_show
            $table->text('notes')->nullable();
            $table->boolean('is_from_public')->default(false);
            $table->string('google_event_id')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('income_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('appointment_id')->nullable()->constrained()->onDelete('set null');
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->date('recorded_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('expense_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('expense_categories')->onDelete('set null');
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->date('recorded_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_records');
        Schema::dropIfExists('expense_categories');
        Schema::dropIfExists('income_records');
        Schema::dropIfExists('appointments');
    }
};
