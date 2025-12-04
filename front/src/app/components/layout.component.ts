import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../services/sidebar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: false
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMobile = false;
  isSidebarOpen = false;
  private subscriptions = new Subscription();

  constructor(public sidebarService: SidebarService) {}

  ngOnInit() {
    this.checkMobile();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    this.subscriptions.add(
      this.sidebarService.isOpen$.subscribe(isOpen => {
        this.isSidebarOpen = isOpen;
      })
    );
  }

  private handleResize = () => {
    this.checkMobile();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    this.subscriptions.unsubscribe();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.sidebarService.open();
    }
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}