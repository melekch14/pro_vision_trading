import { Component, OnInit } from '@angular/core';
import { StatisticsService, DashboardStatistics } from '../../services/statistics.service';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  statistics: DashboardStatistics | null = null;
  loading = true;
  error: string | null = null;

  ordersByStatusChartData: ChartData<'pie'> | null = null;
  ordersByStatusChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false }
    }
  };

  statusDistributionChartData: ChartData<'bar'> | null = null;
  statusDistributionChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {},
      y: { beginAtZero: true }
    }
  };

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.statisticsService.getDashboardStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.prepareCharts();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics.';
        this.loading = false;
      }
    });
  }

  prepareCharts() {
    if (!this.statistics) return;
    const ordersByStatus = this.statistics.ordersByStatus || [];
    const labels = ordersByStatus.map(s => s.status);
    const data = ordersByStatus.map(s => s.count);
    const backgroundColors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#FFCA28', '#26A69A'
    ];
    this.ordersByStatusChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
        }
      ]
    };
    this.statusDistributionChartData = {
      labels,
      datasets: [
        {
          label: 'Orders',
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
        }
      ]
    };
  }
}
