import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ArticleGroup, ArticleFamily, ArticleSubfamily } from '../../shared/models/article-hierarchy.model';
import { ArticleHierarchyService } from '../../shared/services/article-hierarchy.service';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-article-hierarchy',
  templateUrl: './article-hierarchy.component.html',
  styleUrls: ['./article-hierarchy.component.css'],
  standalone: false
})
export class ArticleHierarchyComponent implements OnInit {
  groups: ArticleGroup[] = [];
  families: ArticleFamily[] = [];
  subfamilies: ArticleSubfamily[] = [];
  
  // Selected items
  selectedGroup: ArticleGroup | null = null;
  selectedFamily: ArticleFamily | null = null;
  selectedSubfamily: ArticleSubfamily | null = null;
  
  // New items being created
  newGroup: ArticleGroup = this.getEmptyGroup();
  newFamily: ArticleFamily = this.getEmptyFamily();
  newSubfamily: ArticleSubfamily = this.getEmptySubfamily();
  
  // Edit state
  editingGroup: ArticleGroup | null = null;
  editingFamily: ArticleFamily | null = null;
  editingSubfamily: ArticleSubfamily | null = null;
  
  // Panel visibility
  showGroupPanel: boolean = false;
  showFamilyPanel: boolean = false;
  showSubfamilyPanel: boolean = false;
  
  // Filter state
  groupFilter: string = '';
  familyFilter: string = '';
  subfamilyFilter: string = '';
  
  filteredGroups: ArticleGroup[] = [];
  filteredFamilies: ArticleFamily[] = [];
  filteredSubfamilies: ArticleSubfamily[] = [];

  // Tab management
  activeTab: 'hierarchy' | 'table' = 'hierarchy';

  // Table data
  tableData: Array<{
    groupCode: string;
    groupName: string;
    familyCode: string;
    familyName: string;
    subfamilyCode: string;
    subfamilyName: string;
  }> = [];

  // Import/Export
  importError: string | null = null;
  importSuccess: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private articleHierarchyService: ArticleHierarchyService) {}
  
  ngOnInit(): void {
    this.loadData();
  }

  // Tab management
  onTabChange(tab: 'hierarchy' | 'table'): void {
    this.activeTab = tab;
    if (tab === 'table') {
      // Ensure all data is loaded before building table
      if (this.groups.length > 0 || this.families.length > 0 || this.subfamilies.length > 0) {
        this.buildTableData();
      } else {
        // If no data loaded yet, load it
        this.loadData();
      }
    }
  }

  // Build table data from hierarchy
  buildTableData(): void {
    this.tableData = [];
    
    // For each subfamily, create a row with group, family, and subfamily info
    // This ensures we show all complete hierarchies (group -> family -> subfamily)
    this.subfamilies.forEach(subfamily => {
      const family = this.families.find(f => f.id === subfamily.family_id);
      if (family) {
        const group = this.groups.find(g => g.id === family.group_id);
        if (group) {
          this.tableData.push({
            groupCode: group.code || '',
            groupName: group.name || '',
            familyCode: family.code || '',
            familyName: family.name || '',
            subfamilyCode: subfamily.code || '',
            subfamilyName: subfamily.name || ''
          });
        } else {
          // If group not found, still show the row with empty group fields
          this.tableData.push({
            groupCode: '',
            groupName: '',
            familyCode: family.code || '',
            familyName: family.name || '',
            subfamilyCode: subfamily.code || '',
            subfamilyName: subfamily.name || ''
          });
        }
      } else {
        // If family not found, still show the subfamily with empty parent fields
        this.tableData.push({
          groupCode: '',
          groupName: '',
          familyCode: '',
          familyName: '',
          subfamilyCode: subfamily.code || '',
          subfamilyName: subfamily.name || ''
        });
      }
    });
    
    // Sort by group code, then family code, then subfamily code
    this.tableData.sort((a, b) => {
      if (a.groupCode !== b.groupCode) {
        return a.groupCode.localeCompare(b.groupCode);
      }
      if (a.familyCode !== b.familyCode) {
        return a.familyCode.localeCompare(b.familyCode);
      }
      return a.subfamilyCode.localeCompare(b.subfamilyCode);
    });
  }

  // Excel Export
  exportToExcel(): void {
    this.buildTableData();
    
    const worksheetData = [
      ['Code Groupe', 'Nom Groupe', 'Code famille', 'Nom famille', 'Code sous famille', 'Nom sous famille'],
      ...this.tableData.map(row => [
        row.groupCode,
        row.groupName,
        row.familyCode,
        row.familyName,
        row.subfamilyCode,
        row.subfamilyName
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hiérarchie Articles');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Code Groupe
      { wch: 30 }, // Nom Groupe
      { wch: 15 }, // Code famille
      { wch: 30 }, // Nom famille
      { wch: 20 }, // Code sous famille
      { wch: 40 }  // Nom sous famille
    ];

    XLSX.writeFile(workbook, `hierarchie_articles_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Excel Import
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      this.importError = 'Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)';
      this.importSuccess = null;
      return;
    }

    this.importError = null;
    this.importSuccess = null;

    const formData = new FormData();
    formData.append('file', file);

    this.articleHierarchyService.importFromExcel(formData).subscribe({
      next: (result) => {
        this.importSuccess = `Import réussi: ${result.importedCount} enregistrement(s) importé(s) sur ${result.totalRecords}`;
        this.importError = null;
        // Reload data after import - this will automatically rebuild table if on table tab
        this.loadData();
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      },
      error: (error) => {
        this.importError = error.error?.message || 'Erreur lors de l\'importation du fichier';
        this.importSuccess = null;
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    });
  }
  
  loadData(): void {
    // Load all data in parallel using forkJoin
    forkJoin({
      groups: this.articleHierarchyService.getGroups(),
      families: this.articleHierarchyService.getFamilies(),
      subfamilies: this.articleHierarchyService.getSubfamilies()
    }).subscribe({
      next: ({ groups, families, subfamilies }) => {
        this.groups = groups;
        this.families = families;
        this.subfamilies = subfamilies;
        
        // Apply filters for hierarchy view
        this.applyFilters();
        
        // Update filtered lists based on selections
        if (this.selectedGroup) {
          this.filteredFamilies = this.families.filter(f => f.group_id === this.selectedGroup!.id);
        }
        if (this.selectedFamily) {
          this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
        }
        
        // Build table if on table tab
        if (this.activeTab === 'table') {
          this.buildTableData();
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        // Still try to build table with whatever data we have
        if (this.activeTab === 'table') {
          this.buildTableData();
        }
      }
    });
  }
  
  // Get empty objects for new items
  getEmptyGroup(): ArticleGroup {
    return { id: 0, code: '', name: '' };
  }
  
  getEmptyFamily(): ArticleFamily {
    return { id: 0, code: '', name: '', group_id: this.selectedGroup?.id || 0 };
  }
  
  getEmptySubfamily(): ArticleSubfamily {
    return { id: 0, code: '', name: '', family_id: this.selectedFamily?.id || 0 };
  }
  
  // Selection handlers
  selectGroup(group: ArticleGroup): void {
    this.selectedGroup = group;
    this.selectedFamily = null;
    this.selectedSubfamily = null;
    this.filteredFamilies = this.families.filter(f => f.group_id === group.id);
    this.filteredSubfamilies = [];
    this.familyFilter = '';
    this.subfamilyFilter = '';
  }
  
  selectFamily(family: ArticleFamily): void {
    this.selectedFamily = family;
    this.selectedSubfamily = null;
    this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === family.id);
    this.subfamilyFilter = '';
  }
  
  selectSubfamily(subfamily: ArticleSubfamily): void {
    this.selectedSubfamily = subfamily;
  }
  
  // Panel handlers
  openAddGroupPanel(): void {
    this.newGroup = this.getEmptyGroup();
    this.showGroupPanel = true;
    this.showFamilyPanel = false;
    this.showSubfamilyPanel = false;
    this.editingGroup = null;
  }
  
  openEditGroupPanel(group: ArticleGroup): void {
    this.editingGroup = { ...group };
    this.showGroupPanel = true;
    this.showFamilyPanel = false;
    this.showSubfamilyPanel = false;
  }
  
  openAddFamilyPanel(): void {
    if (!this.selectedGroup) return;
    this.newFamily = this.getEmptyFamily();
    this.showFamilyPanel = true;
    this.showGroupPanel = false;
    this.showSubfamilyPanel = false;
    this.editingFamily = null;
  }
  
  openEditFamilyPanel(family: ArticleFamily): void {
    this.editingFamily = { ...family };
    this.showFamilyPanel = true;
    this.showGroupPanel = false;
    this.showSubfamilyPanel = false;
  }
  
  openAddSubfamilyPanel(): void {
    if (!this.selectedFamily) return;
    this.newSubfamily = this.getEmptySubfamily();
    this.showSubfamilyPanel = true;
    this.showGroupPanel = false;
    this.showFamilyPanel = false;
    this.editingSubfamily = null;
  }
  
  openEditSubfamilyPanel(subfamily: ArticleSubfamily): void {
    this.editingSubfamily = { ...subfamily };
    this.showSubfamilyPanel = true;
    this.showGroupPanel = false;
    this.showFamilyPanel = false;
  }
  
  closeAllPanels(): void {
    this.showGroupPanel = false;
    this.showFamilyPanel = false;
    this.showSubfamilyPanel = false;
    this.editingGroup = null;
    this.editingFamily = null;
    this.editingSubfamily = null;
  }
  
  // Save handlers
  saveGroup(): void {
    if (this.editingGroup) {
      // Update existing group
      this.articleHierarchyService.updateGroup(this.editingGroup.id, this.editingGroup).subscribe({
        next: () => {
          const index = this.groups.findIndex(g => g.id === this.editingGroup!.id);
          if (index !== -1) {
            this.groups[index] = { ...this.editingGroup! };
          }
          this.closeAllPanels();
          this.applyFilters();
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error updating group:', error);
          // Handle error appropriately
        }
      });
    } else {
      // Add new group
      this.articleHierarchyService.createGroup(this.newGroup).subscribe({
        next: (response) => {
          this.groups.push({
            ...this.newGroup,
            id: response.id
          });
          this.closeAllPanels();
          this.applyFilters();
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error creating group:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  saveFamily(): void {
    if (this.editingFamily) {
      // Update existing family
      this.articleHierarchyService.updateFamily(this.editingFamily.id, this.editingFamily).subscribe({
        next: () => {
          const index = this.families.findIndex(f => f.id === this.editingFamily!.id);
          if (index !== -1) {
            this.families[index] = { ...this.editingFamily! };
          }
          this.closeAllPanels();
          if (this.selectedGroup) {
            this.filteredFamilies = this.families.filter(f => f.group_id === this.selectedGroup!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error updating family:', error);
          // Handle error appropriately
        }
      });
    } else if (this.selectedGroup) {
      // Add new family
      this.articleHierarchyService.createFamily(this.newFamily).subscribe({
        next: (response) => {
          this.families.push({
            ...this.newFamily,
            id: response.id,
            group_id: this.selectedGroup!.id
          });
          this.closeAllPanels();
          if (this.selectedGroup) {
            this.filteredFamilies = this.families.filter(f => f.group_id === this.selectedGroup!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error creating family:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  saveSubfamily(): void {
    if (this.editingSubfamily) {
      // Update existing subfamily
      this.articleHierarchyService.updateSubfamily(this.editingSubfamily.id, this.editingSubfamily).subscribe({
        next: () => {
          const index = this.subfamilies.findIndex(s => s.id === this.editingSubfamily!.id);
          if (index !== -1) {
            this.subfamilies[index] = { ...this.editingSubfamily! };
          }
          this.closeAllPanels();
          if (this.selectedFamily) {
            this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error updating subfamily:', error);
          // Handle error appropriately
        }
      });
    } else if (this.selectedFamily) {
      // Add new subfamily
      this.articleHierarchyService.createSubfamily(this.newSubfamily).subscribe({
        next: (response) => {
          this.subfamilies.push({
            ...this.newSubfamily,
            id: response.id,
            family_id: this.selectedFamily!.id
          });
          this.closeAllPanels();
          if (this.selectedFamily) {
            this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error creating subfamily:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  // Delete handlers
  deleteGroup(group: ArticleGroup): void {
    if (confirm(`Are you sure you want to delete the group '${group.name}'? This will also delete all associated families and subfamilies.`)) {
      this.articleHierarchyService.deleteGroup(group.id).subscribe({
        next: () => {
          // Remove the group
          this.groups = this.groups.filter(g => g.id !== group.id);
          
          // Get IDs of families to be removed
          const familyIds = this.families
            .filter(f => f.group_id === group.id)
            .map(f => f.id);
          
          // Remove families
          this.families = this.families.filter(f => f.group_id !== group.id);
          
          // Remove subfamilies
          this.subfamilies = this.subfamilies.filter(s => !familyIds.includes(s.family_id));
          
          // Reset selections if needed
          if (this.selectedGroup?.id === group.id) {
            this.selectedGroup = null;
            this.selectedFamily = null;
            this.selectedSubfamily = null;
            this.filteredFamilies = [];
            this.filteredSubfamilies = [];
          }
          
          this.applyFilters();
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error deleting group:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  deleteFamily(family: ArticleFamily): void {
    if (confirm(`Are you sure you want to delete the family '${family.name}'? This will also delete all associated subfamilies.`)) {
      this.articleHierarchyService.deleteFamily(family.id).subscribe({
        next: () => {
          // Remove the family
          this.families = this.families.filter(f => f.id !== family.id);
          
          // Remove associated subfamilies
          this.subfamilies = this.subfamilies.filter(s => s.family_id !== family.id);
          
          // Reset selections if needed
          if (this.selectedFamily?.id === family.id) {
            this.selectedFamily = null;
            this.selectedSubfamily = null;
            this.filteredSubfamilies = [];
          }
          
          if (this.selectedGroup) {
            this.filteredFamilies = this.families.filter(f => f.group_id === this.selectedGroup!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error deleting family:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  deleteSubfamily(subfamily: ArticleSubfamily): void {
    if (confirm(`Are you sure you want to delete the subfamily '${subfamily.name}'?`)) {
      this.articleHierarchyService.deleteSubfamily(subfamily.id).subscribe({
        next: () => {
          // Remove the subfamily
          this.subfamilies = this.subfamilies.filter(s => s.id !== subfamily.id);
          
          // Reset selection if needed
          if (this.selectedSubfamily?.id === subfamily.id) {
            this.selectedSubfamily = null;
          }
          
          if (this.selectedFamily) {
            this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
          }
          if (this.activeTab === 'table') {
            this.buildTableData();
          }
        },
        error: (error) => {
          console.error('Error deleting subfamily:', error);
          // Handle error appropriately
        }
      });
    }
  }
  
  // Filter handlers
  applyFilters(): void {
    this.filteredGroups = this.groups.filter(group =>
      group.name.toLowerCase().includes(this.groupFilter.toLowerCase()) ||
      group.code.toLowerCase().includes(this.groupFilter.toLowerCase())
    );
    
    if (this.selectedGroup) {
      this.filteredFamilies = this.families
        .filter(f => f.group_id === this.selectedGroup!.id)
        .filter(family =>
          family.name.toLowerCase().includes(this.familyFilter.toLowerCase()) ||
          family.code.toLowerCase().includes(this.familyFilter.toLowerCase())
        );
    }
    
    if (this.selectedFamily) {
      this.filteredSubfamilies = this.subfamilies
        .filter(s => s.family_id === this.selectedFamily!.id)
        .filter(subfamily =>
          subfamily.name.toLowerCase().includes(this.subfamilyFilter.toLowerCase()) ||
          subfamily.code.toLowerCase().includes(this.subfamilyFilter.toLowerCase())
        );
    }
  }
  
  // Helper methods
  getGroupById(id: number): ArticleGroup | undefined {
    return this.groups.find(g => g.id === id);
  }
  
  getFamilyById(id: number): ArticleFamily | undefined {
    return this.families.find(f => f.id === id);
  }
} 