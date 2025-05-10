import { Component, OnInit } from '@angular/core';
import { ArticleGroup, ArticleFamily, ArticleSubfamily } from '../../shared/models/article-hierarchy.model';

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
  
  ngOnInit(): void {
    // Load sample data
    this.loadSampleData();
    this.applyFilters();
  }
  
  loadSampleData(): void {
    // Sample groups
    this.groups = [
      { id: 1, code: 'GRP001', name: 'Electronics' },
      { id: 2, code: 'GRP002', name: 'Clothing' },
      { id: 3, code: 'GRP003', name: 'Furniture' },
      { id: 4, code: 'GRP004', name: 'Food & Beverages' }
    ];
    
    // Sample families
    this.families = [
      { id: 1, code: 'FAM001', name: 'Computers', group_id: 1 },
      { id: 2, code: 'FAM002', name: 'Smartphones', group_id: 1 },
      { id: 3, code: 'FAM003', name: 'Men\'s Clothing', group_id: 2 },
      { id: 4, code: 'FAM004', name: 'Women\'s Clothing', group_id: 2 },
      { id: 5, code: 'FAM005', name: 'Living Room', group_id: 3 },
      { id: 6, code: 'FAM006', name: 'Beverages', group_id: 4 }
    ];
    
    // Sample subfamilies
    this.subfamilies = [
      { id: 1, code: 'SUB001', name: 'Laptops', family_id: 1 },
      { id: 2, code: 'SUB002', name: 'Desktops', family_id: 1 },
      { id: 3, code: 'SUB003', name: 'Android Phones', family_id: 2 },
      { id: 4, code: 'SUB004', name: 'iPhones', family_id: 2 },
      { id: 5, code: 'SUB005', name: 'T-Shirts', family_id: 3 },
      { id: 6, code: 'SUB006', name: 'Jeans', family_id: 3 },
      { id: 7, code: 'SUB007', name: 'Dresses', family_id: 4 },
      { id: 8, code: 'SUB008', name: 'Skirts', family_id: 4 },
      { id: 9, code: 'SUB009', name: 'Sofas', family_id: 5 },
      { id: 10, code: 'SUB010', name: 'Coffee Tables', family_id: 5 },
      { id: 11, code: 'SUB011', name: 'Soft Drinks', family_id: 6 },
      { id: 12, code: 'SUB012', name: 'Alcoholic Drinks', family_id: 6 }
    ];
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
      const index = this.groups.findIndex(g => g.id === this.editingGroup!.id);
      if (index !== -1) {
        this.groups[index] = { ...this.editingGroup };
      }
    } else {
      // Add new group
      const newId = Math.max(0, ...this.groups.map(g => g.id)) + 1;
      this.groups.push({
        ...this.newGroup,
        id: newId
      });
    }
    
    this.closeAllPanels();
    this.applyFilters();
  }
  
  saveFamily(): void {
    if (this.editingFamily) {
      // Update existing family
      const index = this.families.findIndex(f => f.id === this.editingFamily!.id);
      if (index !== -1) {
        this.families[index] = { ...this.editingFamily };
      }
    } else if (this.selectedGroup) {
      // Add new family
      const newId = Math.max(0, ...this.families.map(f => f.id)) + 1;
      this.families.push({
        ...this.newFamily,
        id: newId,
        group_id: this.selectedGroup.id
      });
    }
    
    this.closeAllPanels();
    if (this.selectedGroup) {
      this.filteredFamilies = this.families.filter(f => f.group_id === this.selectedGroup!.id);
    }
  }
  
  saveSubfamily(): void {
    if (this.editingSubfamily) {
      // Update existing subfamily
      const index = this.subfamilies.findIndex(s => s.id === this.editingSubfamily!.id);
      if (index !== -1) {
        this.subfamilies[index] = { ...this.editingSubfamily };
      }
    } else if (this.selectedFamily) {
      // Add new subfamily
      const newId = Math.max(0, ...this.subfamilies.map(s => s.id)) + 1;
      this.subfamilies.push({
        ...this.newSubfamily,
        id: newId,
        family_id: this.selectedFamily.id
      });
    }
    
    this.closeAllPanels();
    if (this.selectedFamily) {
      this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
    }
  }
  
  // Delete handlers
  deleteGroup(group: ArticleGroup): void {
    if (confirm(`Are you sure you want to delete the group '${group.name}'? This will also delete all associated families and subfamilies.`)) {
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
    }
  }
  
  deleteFamily(family: ArticleFamily): void {
    if (confirm(`Are you sure you want to delete the family '${family.name}'? This will also delete all associated subfamilies.`)) {
      // Remove the family
      this.families = this.families.filter(f => f.id !== family.id);
      
      // Remove subfamilies
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
    }
  }
  
  deleteSubfamily(subfamily: ArticleSubfamily): void {
    if (confirm(`Are you sure you want to delete the subfamily '${subfamily.name}'?`)) {
      // Remove the subfamily
      this.subfamilies = this.subfamilies.filter(s => s.id !== subfamily.id);
      
      // Reset selection if needed
      if (this.selectedSubfamily?.id === subfamily.id) {
        this.selectedSubfamily = null;
      }
      
      if (this.selectedFamily) {
        this.filteredSubfamilies = this.subfamilies.filter(s => s.family_id === this.selectedFamily!.id);
      }
    }
  }
  
  // Filter handlers
  applyFilters(): void {
    // Filter groups
    this.filteredGroups = this.groups.filter(group => 
      group.code.toLowerCase().includes(this.groupFilter.toLowerCase()) ||
      group.name.toLowerCase().includes(this.groupFilter.toLowerCase())
    );
    
    // Filter families if a group is selected
    if (this.selectedGroup) {
      this.filteredFamilies = this.families
        .filter(family => family.group_id === this.selectedGroup!.id)
        .filter(family => 
          family.code.toLowerCase().includes(this.familyFilter.toLowerCase()) ||
          family.name.toLowerCase().includes(this.familyFilter.toLowerCase())
        );
    }
    
    // Filter subfamilies if a family is selected
    if (this.selectedFamily) {
      this.filteredSubfamilies = this.subfamilies
        .filter(subfamily => subfamily.family_id === this.selectedFamily!.id)
        .filter(subfamily => 
          subfamily.code.toLowerCase().includes(this.subfamilyFilter.toLowerCase()) ||
          subfamily.name.toLowerCase().includes(this.subfamilyFilter.toLowerCase())
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