import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css'],
  standalone: false
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  isMobile = false;
  private subscriptions = new Subscription();

  constructor(public sidebarService: SidebarService) {}

  ngOnInit() {
    this.checkMobile();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.checkMobile();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
} 