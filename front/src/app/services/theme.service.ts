import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode.next(savedTheme === 'dark');
      this.setTheme(savedTheme === 'dark');
    }
  }

  toggleTheme() {
    const newValue = !this.isDarkMode.value;
    this.isDarkMode.next(newValue);
    this.setTheme(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
  }

  private setTheme(isDark: boolean) {
    document.body.classList.toggle('dark-theme', isDark);
  }
}
