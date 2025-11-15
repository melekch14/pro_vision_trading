import { Component, OnInit } from '@angular/core';
import { ActivityHistoryService, Activity, ActivityStatistics, ActivityFilters, User } from '../../services/activity-history.service';

@Component({
  selector: 'app-activity-history',
  templateUrl: './activity-history.component.html',
  styleUrls: ['./activity-history.component.css'],
  standalone: false
})
export class ActivityHistoryComponent implements OnInit {
  activities: Activity[] = [];
  statistics: ActivityStatistics | null = null;
  users: User[] = [];
  actions: string[] = [];
  
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  searchTerm = '';
  selectedAction: string = 'All actions';
  selectedUser: string = 'All users';
  filters: ActivityFilters = {};
  
  constructor(private activityHistoryService: ActivityHistoryService) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadUsers();
    this.loadActions();
    this.loadActivities();
  }

  loadStatistics(): void {
    this.activityHistoryService.getActivityStatistics().subscribe({
      next: (response) => {
        // Extract statistics from response (backend returns { success: true, ...stats })
        if (response.success) {
          const { success, ...stats } = response;
          this.statistics = stats as ActivityStatistics;
        }
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  loadUsers(): void {
    this.activityHistoryService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users;
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  loadActions(): void {
    this.activityHistoryService.getActions().subscribe({
      next: (response) => {
        this.actions = response.actions;
      },
      error: (err) => {
        console.error('Error loading actions:', err);
      }
    });
  }

  loadActivities(): void {
    this.loading = true;
    this.error = null;

    // Apply filters
    const filters: ActivityFilters = {};
    if (this.selectedAction && this.selectedAction !== 'All actions') {
      filters.action = this.selectedAction;
    }
    if (this.selectedUser && this.selectedUser !== 'All users') {
      const user = this.users.find(u => `${u.user_name} (${u.user_role})` === this.selectedUser);
      if (user) {
        filters.userId = user.user_id;
      }
    }

    this.activityHistoryService.getActivities(this.currentPage, this.pageSize, filters).subscribe({
      next: (response) => {
        // Filter by search term on client side
        let filteredActivities = response.activities;
        if (this.searchTerm.trim()) {
          const search = this.searchTerm.toLowerCase();
          filteredActivities = response.activities.filter(activity =>
            activity.user_name.toLowerCase().includes(search) ||
            activity.action.toLowerCase().includes(search) ||
            (activity.target && activity.target.toLowerCase().includes(search)) ||
            (activity.ip_address && activity.ip_address.toLowerCase().includes(search))
          );
        }
        
        this.activities = filteredActivities;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load activities';
        this.loading = false;
        console.error('Error loading activities:', err);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadActivities();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadActivities();
  }

  refresh(): void {
    this.loadStatistics();
    this.loadActivities();
  }

  exportToCSV(): void {
    // Get all activities without pagination for export
    this.activityHistoryService.getActivities(1, 10000, this.filters).subscribe({
      next: (response) => {
        const csvContent = this.convertToCSV(response.activities);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => {
        console.error('Error exporting activities:', err);
      }
    });
  }

  convertToCSV(activities: Activity[]): string {
    const headers = ['User', 'Action', 'Target', 'Time', 'IP Address'];
    const rows = activities.map(activity => [
      activity.user_name,
      activity.action,
      activity.target || '-',
      this.formatTime(activity.created_at),
      activity.ip_address || '-'
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `about ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  getActionColor(action: string): string {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created') || lowerAction.includes('créé')) {
      return 'green';
    } else if (lowerAction.includes('updated') || lowerAction.includes('modifié') || lowerAction.includes('updated')) {
      return 'blue';
    } else if (lowerAction.includes('deleted') || lowerAction.includes('supprimé')) {
      return 'red';
    } else if (lowerAction.includes('logged in') || lowerAction.includes('connecté')) {
      return 'gray';
    } else if (lowerAction.includes('uploaded') || lowerAction.includes('téléchargé')) {
      return 'orange';
    } else if (lowerAction.includes('downloaded') || lowerAction.includes('téléchargé')) {
      return 'blue';
    }
    return 'gray';
  }

  getActionIcon(action: string): string {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created') || lowerAction.includes('créé')) {
      return 'add_circle';
    } else if (lowerAction.includes('updated') || lowerAction.includes('modifié')) {
      return 'edit';
    } else if (lowerAction.includes('deleted') || lowerAction.includes('supprimé')) {
      return 'delete';
    } else if (lowerAction.includes('logged in') || lowerAction.includes('connecté')) {
      return 'lock';
    } else if (lowerAction.includes('uploaded')) {
      return 'upload';
    } else if (lowerAction.includes('downloaded')) {
      return 'download';
    } else if (lowerAction.includes('settings')) {
      return 'settings';
    }
    return 'description';
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getUserAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadActivities();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadActivities();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadActivities();
    }
  }
}

