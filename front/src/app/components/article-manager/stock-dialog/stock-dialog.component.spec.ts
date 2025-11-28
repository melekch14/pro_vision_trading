import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StockDialogComponent } from './stock-dialog.component';
import { StockService } from '../../../services/stock.service';
import { of } from 'rxjs';

describe('StockDialogComponent', () => {
  let component: StockDialogComponent;
  let fixture: ComponentFixture<StockDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<StockDialogComponent>>;
  let mockStockService: jasmine.SpyObj<StockService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create mock objects
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockStockService = jasmine.createSpyObj('StockService', ['getStockByArticleId']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock the getStockByArticleId to return empty array by default
    mockStockService.getStockByArticleId.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [StockDialogComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            article: {
              id: 1,
              code: 'TEST001',
              libelle: 'Test Article',
              min_sphere: -4,
              max_sphere: 4,
              min_cylindre: -2,
              max_cylindre: 2,
              type_stock: 'cylindre'
            }
          }
        },
        { provide: StockService, useValue: mockStockService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize sphere values', () => {
    expect(component.sphereValues.length).toBeGreaterThan(0);
  });

  it('should initialize cylindre values', () => {
    expect(component.cylindreValues.length).toBeGreaterThan(0);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
