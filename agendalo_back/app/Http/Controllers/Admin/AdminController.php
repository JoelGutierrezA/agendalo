<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class AdminController extends Controller
{
    public function businesses() { return $this->success([]); }
    public function showBusiness($id) { return $this->success(null); }
    public function toggleBusiness($id) { return $this->success(null); }
    public function stats() { return $this->success([]); }
}
