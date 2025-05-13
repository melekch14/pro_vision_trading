import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArticleParamsService, ArticleParam } from '../../services/article-params.service';

@Component({
  selector: 'app-article-params',
  templateUrl: './article-params.component.html',
  styleUrls: ['./article-params.component.scss'],
  standalone: false
})
export class ArticleParamsComponent implements OnInit {
  activePanel: string = 'foyers';
  params: { [key: string]: ArticleParam[] } = {
    'foyers': [],
    'indices': [],
    'designs': [],
    'couleur-photos': [],
    'traitements': []
  };
  filteredParams: { [key: string]: ArticleParam[] } = {
    'foyers': [],
    'indices': [],
    'designs': [],
    'couleur-photos': [],
    'traitements': []
  };
  paramForms: { [key: string]: FormGroup } = {};
  filterForms: { [key: string]: FormGroup } = {};
  
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private articleParamsService: ArticleParamsService
  ) {}

  ngOnInit() {
    const paramTypes = ['foyers', 'indices', 'designs', 'couleur-photos', 'traitements'];
    paramTypes.forEach(type => {
      this.paramForms[type] = this.fb.group({
        name: ['', Validators.required],
        description: ['']
      });
      this.filterForms[type] = this.fb.group({
        search: ['']
      });
      // Subscribe to filter changes for instant filtering
      this.filterForms[type].get('search')!.valueChanges.subscribe(value => {
        this.applyFilter(type, value);
      });
    });
    this.loadParams();
  }

  setPanel(panel: string) {
    this.activePanel = panel;
  }

  loadParams() {
    const paramTypes = ['foyers', 'indices', 'designs', 'couleur-photos', 'traitements'];
    paramTypes.forEach(type => {
      this.articleParamsService.getParams(type).subscribe({
        next: (params) => {
          this.params[type] = params;
          this.filteredParams[type] = params;
        },
        error: (error) => {
          this.snackBar.open('Error loading parameters', 'Close', {
            duration: 3000
          });
          console.error('Error loading parameters:', error);
        }
      });
    });
  }

  onSubmit(type: string) {
    if (this.paramForms[type].valid) {
      const newParam = {
        ...this.paramForms[type].value
      };
      this.articleParamsService.createParam(type, newParam).subscribe({
        next: (createdParam) => {
          this.params[type].push(createdParam);
          this.applyFilter(type); // Update filtered list
          this.paramForms[type].reset();
          this.snackBar.open('Parameter added successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open('Error adding parameter', 'Close', {
            duration: 3000
          });
          console.error('Error adding parameter:', error);
        }
      });
    }
  }

  applyFilter(type: string, searchTerm?: string) {
    const term = (searchTerm ?? this.filterForms[type].get('search')?.value ?? '').toLowerCase();
    this.filteredParams[type] = this.params[type].filter(param =>
      param.name.toLowerCase().includes(term)
    );
  }

  resetFilter(type: string) {
    this.filterForms[type].reset();
    this.filteredParams[type] = this.params[type];
  }

  deleteParam(type: string, id: number) {
    this.articleParamsService.deleteParam(type, id).subscribe({
      next: () => {
        this.params[type] = this.params[type].filter(param => param.id !== id);
        this.applyFilter(type); // Update filtered list
        this.snackBar.open('Parameter deleted successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Error deleting parameter', 'Close', {
          duration: 3000
        });
        console.error('Error deleting parameter:', error);
      }
    });
  }
} 