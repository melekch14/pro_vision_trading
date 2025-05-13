import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ArticleParam {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
}

@Component({
  selector: 'app-article-params',
  templateUrl: './article-params.component.html',
  styleUrls: ['./article-params.component.scss'],
  standalone: false
})
export class ArticleParamsComponent implements OnInit {
  activePanel: string = 'foyer';
  params: { [key: string]: ArticleParam[] } = {
    foyer: [],
    indice: [],
    design: [],
    couleurPhoto: [],
    traitement: []
  };
  
  paramForms: { [key: string]: FormGroup } = {};
  filterForms: { [key: string]: FormGroup } = {};
  
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Initialize forms for each parameter type
    const paramTypes = ['foyer', 'indice', 'design', 'couleurPhoto', 'traitement'];
    
    paramTypes.forEach(type => {
      this.paramForms[type] = this.fb.group({
        name: ['', Validators.required],
        description: ['']
      });

      this.filterForms[type] = this.fb.group({
        search: ['']
      });
    });

    // Load initial data
    this.loadParams();
  }

  setPanel(panel: string) {
    this.activePanel = panel;
  }

  loadParams() {
    // TODO: Implement API calls to load parameters
    // This is mock data for now
    this.params = {
      foyer: [
        { id: 1, name: 'Foyer 1', description: 'Description 1', createdAt: new Date() },
        { id: 2, name: 'Foyer 2', description: 'Description 2', createdAt: new Date() }
      ],
      indice: [
        { id: 1, name: 'Indice 1', description: 'Description 1', createdAt: new Date() }
      ],
      design: [],
      couleurPhoto: [],
      traitement: []
    };
  }

  onSubmit(type: string) {
    if (this.paramForms[type].valid) {
      const newParam = {
        id: Date.now(), // Temporary ID generation
        ...this.paramForms[type].value,
        createdAt: new Date()
      };

      this.params[type].push(newParam);
      this.paramForms[type].reset();
      
      this.snackBar.open('Parameter added successfully', 'Close', {
        duration: 3000
      });
    }
  }

  applyFilter(type: string) {
    const searchTerm = this.filterForms[type].get('search')?.value.toLowerCase();
    // TODO: Implement filtering logic
  }

  resetFilter(type: string) {
    this.filterForms[type].reset();
    this.applyFilter(type);
  }

  deleteParam(type: string, id: number) {
    this.params[type] = this.params[type].filter(param => param.id !== id);
    this.snackBar.open('Parameter deleted successfully', 'Close', {
      duration: 3000
    });
  }
} 