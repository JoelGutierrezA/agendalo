import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplyService, SupplyTransaction, Supply } from '../../services/supply.service';
import Swal from 'sweetalert2';
import { SubscriptionService } from '../../../subscription/services/subscription.service';

@Component({
  selector: 'app-supplies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './supplies.component.html'
})
export class SuppliesComponent implements OnInit {
  purchases: SupplyTransaction[] = [];
  catalog: Supply[] = [];
  
  loadingTable = false;
  showPurchaseModal = false;
  showCatalogModal = false;
  
  purchaseForm: FormGroup;
  catalogForm: FormGroup;

  constructor(
    private supplyService: SupplyService,
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService
  ) {
    this.purchaseForm = this.fb.group({
      supply_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit_cost: [0, [Validators.required, Validators.min(0)]],
      purchased_at: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });

    this.catalogForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCatalog();
    this.loadPurchases();
  }

  loadPurchases() {
    this.loadingTable = true;
    this.supplyService.getPurchases().subscribe({
      next: (res) => {
        this.purchases = res.data.data;
        this.loadingTable = false;
      },
      error: () => this.loadingTable = false
    });
  }

  loadCatalog() {
    this.supplyService.getCatalog().subscribe({
      next: (res) => {
        this.catalog = res.data;
      }
    });
  }

  openPurchaseModal() {
    if (!this.assertOperationAllowed()) return;

    this.purchaseForm.reset({
      quantity: 1,
      unit_cost: 0,
      purchased_at: new Date().toISOString().split('T')[0]
    });
    this.showPurchaseModal = true;
  }

  openCatalogModal() {
    if (!this.assertOperationAllowed()) return;

    this.catalogForm.reset();
    this.showCatalogModal = true;
  }

  savePurchase() {
    if (!this.assertOperationAllowed()) return;

    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    this.supplyService.registerPurchase(this.purchaseForm.value).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Compra Registrada',
          text: 'Se ha descontado del balance general con éxito.',
          timer: 2500,
          showConfirmButton: false
        });
        this.showPurchaseModal = false;
        this.loadPurchases();
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'Error al guardar', 'error');
      }
    });
  }

  saveCatalogItem() {
    if (!this.assertOperationAllowed()) return;

    if (this.catalogForm.invalid) {
      this.catalogForm.markAllAsTouched();
      return;
    }

    this.supplyService.createSupply(this.catalogForm.value).subscribe({
      next: (res) => {
        this.catalog.push(res.data);
        this.showCatalogModal = false;
        
        // Autoseleccionar id recién creado para hacer fácil la compra
        this.purchaseForm.patchValue({ supply_id: res.data.id });
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo crear insumo', 'error');
      }
    });
  }

  deletePurchase(id: number) {
    if (!this.assertOperationAllowed()) return;

    Swal.fire({
      title: '¿Revertir esta compra?',
      text: "Esto devolverá el dinero descontado al balance de tus finanzas.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, revertir',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.supplyService.deletePurchase(id).subscribe({
          next: () => {
             this.loadPurchases();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  canOperate(): boolean {
    return this.subscriptionService.canOperate();
  }

  private assertOperationAllowed(): boolean {
    if (this.subscriptionService.canOperate()) return true;

    Swal.fire('Solo lectura', 'Tu suscripcion esta en periodo de gracia. Puedes consultar insumos, pero debes renovar para realizar cambios.', 'warning');
    return false;
  }
}
