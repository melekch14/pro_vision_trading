import { Component, OnInit } from '@angular/core';
import { StatisticsService, DashboardStatistics } from '../../services/statistics.service';

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

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.statisticsService.getDashboardStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics.';
        this.loading = false;
      }
    });
  }
}
