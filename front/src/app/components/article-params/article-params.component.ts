import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArticleParamsService, ArticleParam } from '../../services/article-params.service';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';

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
    'traitements': [],
    'type-articles': []
  };
  filteredParams: { [key: string]: ArticleParam[] } = {
    'foyers': [],
    'indices': [],
    'designs': [],
    'couleur-photos': [],
    'traitements': [],
    'type-articles': []
  };
  paramForms: { [key: string]: FormGroup } = {};
  filterForms: { [key: string]: FormGroup } = {};
  allData: Array<{ type: string, name: string, description: string }> = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private articleParamsService: ArticleParamsService
  ) { }

  ngOnInit() {
    const paramTypes = ['foyers', 'indices', 'designs', 'couleur-photos', 'traitements', 'type-articles'];
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
    if (panel === 'all-data') {
      this.loadAllData();
    }
  }

  loadParams() {
    const paramTypes = ['foyers', 'indices', 'designs', 'couleur-photos', 'traitements', 'type-articles'];
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
          this.snackBar.open('Paramètre ajouté avec succès', 'Fermer', {
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
        if (this.activePanel === 'all-data') {
          this.loadAllData();
        }
        this.snackBar.open('Paramètre supprimé avec succès', 'Fermer', {
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

  loadAllData() {
    const paramTypes = ['foyers', 'indices', 'designs', 'couleur-photos', 'traitements', 'type-articles'];
    const typeLabels: { [key: string]: string } = {
      'foyers': 'Foyer',
      'indices': 'Indice',
      'designs': 'Design',
      'couleur-photos': 'Couleur Photo',
      'traitements': 'Traitement',
      'type-articles': 'Type Article'
    };

    const requests = paramTypes.map(type =>
      this.articleParamsService.getParams(type)
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.allData = [];
        results.forEach((params, index) => {
          const type = paramTypes[index];
          const typeLabel = typeLabels[type];
          params.forEach(param => {
            this.allData.push({
              type: typeLabel,
              name: param.name,
              description: param.description || ''
            });
          });
        });
      },
      error: (error) => {
        this.snackBar.open('Error loading all data', 'Close', {
          duration: 3000
        });
        console.error('Error loading all data:', error);
      }
    });
  }

  exportToExcel() {
    // Prepare data in Excel format (matching the image structure)
    // Only include cells with values, matching the sparse format shown in the image
    const excelData: any[] = [];

    // Headers
    excelData.push(['Type d\'article', 'Foyer', 'Indice', 'Design', 'Couleur photo', 'Traitement']);

    // Group data by type
    const typeArticles = this.allData.filter(d => d.type === 'Type Article').map(d => d.name);
    const foyers = this.allData.filter(d => d.type === 'Foyer').map(d => d.name);
    const indices = this.allData.filter(d => d.type === 'Indice').map(d => d.name);
    const designs = this.allData.filter(d => d.type === 'Design').map(d => d.name);
    const couleurPhotos = this.allData.filter(d => d.type === 'Couleur Photo').map(d => d.name);
    const traitements = this.allData.filter(d => d.type === 'Traitement').map(d => d.name);

    // Find the maximum length to determine number of rows
    const maxLength = Math.max(
      typeArticles.length,
      foyers.length,
      indices.length,
      designs.length,
      couleurPhotos.length,
      traitements.length
    );

    // Create rows - only include cells with values (empty strings for missing values)
    // Only create rows if there's at least one value
    if (maxLength > 0) {
      for (let i = 0; i < maxLength; i++) {
        const row: any[] = [];

        // Only add value if it exists at this index, otherwise empty string
        row.push(i < typeArticles.length ? typeArticles[i] : '');
        row.push(i < foyers.length ? foyers[i] : '');
        row.push(i < indices.length ? indices[i] : '');
        row.push(i < designs.length ? designs[i] : '');
        row.push(i < couleurPhotos.length ? couleurPhotos[i] : '');
        row.push(i < traitements.length ? traitements[i] : '');

        // Only add row if it has at least one non-empty value
        if (row.some(cell => cell !== '')) {
          excelData.push(row);
        }
      }
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Article Parameters');

    // Export to file
    XLSX.writeFile(wb, 'article-params.xlsx');
    this.snackBar.open('Données exportées avec succès', 'Fermer', {
      duration: 3000
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        // Parse Excel data according to the format
        // Column A: Type d'article, B: Foyer, C: Indice, D: Design, E: Couleur photo, F: Traitement
        const importData: { [key: string]: Set<string> } = {
          'type-articles': new Set(),
          'foyers': new Set(),
          'indices': new Set(),
          'designs': new Set(),
          'couleur-photos': new Set(),
          'traitements': new Set()
        };

        // Skip header row (index 0)
        // Process each row and extract only cells with values
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row) continue;

          // Process each column independently - only add non-empty values
          // Column A (index 0): Type d'article
          if (row[0] !== undefined && row[0] !== null && String(row[0]).trim() !== '') {
            importData['type-articles'].add(String(row[0]).trim());
          }
          // Column B (index 1): Foyer
          if (row[1] !== undefined && row[1] !== null && String(row[1]).trim() !== '') {
            importData['foyers'].add(String(row[1]).trim());
          }
          // Column C (index 2): Indice
          if (row[2] !== undefined && row[2] !== null && String(row[2]).trim() !== '') {
            importData['indices'].add(String(row[2]).trim());
          }
          // Column D (index 3): Design
          if (row[3] !== undefined && row[3] !== null && String(row[3]).trim() !== '') {
            importData['designs'].add(String(row[3]).trim());
          }
          // Column E (index 4): Couleur photo
          if (row[4] !== undefined && row[4] !== null && String(row[4]).trim() !== '') {
            importData['couleur-photos'].add(String(row[4]).trim());
          }
          // Column F (index 5): Traitement
          if (row[5] !== undefined && row[5] !== null && String(row[5]).trim() !== '') {
            importData['traitements'].add(String(row[5]).trim());
          }
        }

        // Import data via service
        this.articleParamsService.importBulk(importData).subscribe({
          next: (result) => {
            this.snackBar.open(`Import successful: ${result.created} items created, ${result.skipped} duplicates skipped`, 'Close', {
              duration: 5000
            });
            this.loadParams();
            if (this.activePanel === 'all-data') {
              this.loadAllData();
            }
            // Reset file input
            event.target.value = '';
          },
          error: (error) => {
            this.snackBar.open('Error importing data: ' + (error.error?.error || error.message), 'Close', {
              duration: 5000
            });
            console.error('Error importing data:', error);
            event.target.value = '';
          }
        });
      } catch (error: any) {
        this.snackBar.open('Error reading file: ' + error.message, 'Close', {
          duration: 3000
        });
        console.error('Error reading file:', error);
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }
} 