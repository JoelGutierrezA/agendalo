import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexYAxis, ApexFill, ApexGrid } from "ng-apexcharts";
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DashboardService, DashboardSummary } from '../../../../core/services/dashboard.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  fill: ApexFill;
  yaxis: ApexYAxis;
  grid: ApexGrid;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule],
  template: `
    <div class="space-y-6 fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title text-2xl font-bold">Dashboard</h1>
          <p class="text-text-secondary text-sm">Resumen de rendimiento de tu negocio</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/app/citas/nueva" class="btn-primary shadow-sm hover:shadow-md transition-all">
            <span>+</span> Nueva cita
          </a>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (kpi of kpis; track kpi.label) {
          <div class="card p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">{{ kpi.label }}</p>
                @if (loading) {
                  <div class="skeleton-text w-24 h-8 mt-1"></div>
                } @else {
                  <p class="text-2xl font-bold text-text-primary">{{ kpi.value }}</p>
                }
              </div>
              <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" [style.background]="kpi.iconBg" [style.color]="kpi.iconColor">
                <span class="text-xl">{{ kpi.icon }}</span>
              </div>
            </div>
            <!-- Subtitle/Trend -->
            <div class="mt-4 flex items-center gap-1">
               <span class="text-xs font-medium" [class]="kpi.trendColor">{{ kpi.trend }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico Principal -->
        <div class="card lg:col-span-2 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-text-primary">Evolución Semanal</h3>
            <div class="flex gap-4">
              <span class="flex items-center gap-1.5 text-xs text-text-secondary">
                <span class="w-2 h-2 rounded-full bg-primary"></span> Citas
              </span>
              <span class="flex items-center gap-1.5 text-xs text-text-secondary">
                <span class="w-2 h-2 rounded-full bg-green-500"></span> Ingresos
              </span>
            </div>
          </div>
          
          @if (loading) {
            <div class="h-64 flex items-center justify-center bg-background rounded-lg">
              <span class="text-text-secondary text-sm">Cargando gráfico...</span>
            </div>
          } @else {
            <div id="chart" class="h-64">
              <apx-chart
                [series]="chartOptions.series!"
                [chart]="chartOptions.chart!"
                [xaxis]="chartOptions.xaxis!"
                [stroke]="chartOptions.stroke!"
                [dataLabels]="chartOptions.dataLabels!"
                [tooltip]="chartOptions.tooltip!"
                [fill]="chartOptions.fill!"
                [yaxis]="chartOptions.yaxis!"
                [grid]="chartOptions.grid!"
              ></apx-chart>
            </div>
          }
        </div>

        <!-- Próximas Citas -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-text-primary">Próximas Citas</h3>
            <a routerLink="/app/agenda" class="text-xs text-primary font-medium hover:underline">Ver todas</a>
          </div>

          @if (loading) {
            <div class="space-y-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="flex items-center gap-3">
                  <div class="skeleton w-10 h-10 rounded-lg"></div>
                  <div class="flex-1 space-y-2">
                    <div class="skeleton w-3/4 h-3"></div>
                    <div class="skeleton w-1/2 h-2"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (upcomingAppointments.length === 0) {
            <div class="py-8 text-center bg-background/50 rounded-lg border border-border border-dashed">
               <span class="text-2xl block mb-2 opacity-50">📅</span>
               <p class="text-text-secondary text-sm">No hay citas próximas</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (apt of upcomingAppointments; track apt.id) {
                <div class="flex items-center justify-between group">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 border border-border flex flex-col items-center justify-center text-[10px] font-bold text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <span>{{ apt.time }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-text-primary truncate max-w-[120px]">{{ apt.client_name }}</p>
                      <p class="text-[11px] text-text-secondary">{{ apt.service_name }}</p>
                    </div>
                  </div>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-blue-50 text-blue-700': apt.status === 'confirmed',
                      'bg-yellow-50 text-yellow-700': apt.status === 'pending'
                    }">
                    {{ apt.status === 'confirmed' ? 'Conf' : 'Pend' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  loading = true;
  upcomingAppointments: any[] = [];

  kpis: any[] = [
    { label: 'Citas Hoy', value: '0', icon: '📅', iconBg: '#EFF6FF', iconColor: '#3B82F6', trend: 'Hoy', trendColor: 'text-text-secondary' },
    { label: 'Ingresos (Mes)', value: '$0', icon: '💰', iconBg: '#F0FDF4', iconColor: '#22C55E', trend: 'Actual', trendColor: 'text-success' },
    { label: 'Egresos (Mes)', value: '$0', icon: '📉', iconBg: '#FEF2F2', iconColor: '#EF4444', trend: 'Actual', trendColor: 'text-danger' },
    { label: 'Balance', value: '$0', icon: '📊', iconBg: '#F8FAFC', iconColor: '#64748B', trend: 'Mensual', trendColor: 'text-text-secondary' },
  ];

  public chartOptions: Partial<ChartOptions> = {};

  constructor(
    private dashboardService: DashboardService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.initChart();
    this.loadData();
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        { name: "Citas", data: [] },
        { name: "Ingresos", data: [] }
      ],
      chart: {
        height: 260,
        type: "area",
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100, 100]
        }
      },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: [
        { title: { text: "Citas" } },
        { opposite: true, title: { text: "Ingresos ($)" } }
      ] as any,
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 4,
        padding: { left: 0, right: 0 }
      },
      tooltip: { x: { format: "dd/MM/yy" } }
    };
  }

  private loadData(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data: DashboardSummary) => {
        // Actualizar KPIs
        const fmt = new Intl.NumberFormat('es-CL');
        this.kpis[0].value = data.kpis.today_appointments.toString();
        this.kpis[1].value = `$${fmt.format(data.kpis.monthly_income)}`;
        this.kpis[2].value = `$${fmt.format(data.kpis.monthly_expenses)}`;
        this.kpis[3].value = `$${fmt.format(data.kpis.monthly_balance)}`;
        this.kpis[3].trendColor = data.kpis.monthly_balance >= 0 ? 'text-success' : 'text-danger';

        this.upcomingAppointments = data.upcoming_appointments;

        // Actualizar Gráfico
        this.chartOptions.series = [
          { name: "Citas", data: data.chart_data.appointments },
          { name: "Ingresos", data: data.chart_data.income }
        ];
        this.chartOptions.xaxis = {
          categories: data.chart_data.labels,
          axisBorder: { show: false },
          axisTicks: { show: false }
        };
        
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
