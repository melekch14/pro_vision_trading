import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArticleManagerComponent } from './article-manager.component';
import { ArticleService } from '../../services/article.service';
import { ArticleParamsService } from '../../services/article-params.service';
import { ArticleHierarchyService } from '../../shared/services/article-hierarchy.service';
import { StockService } from '../../services/stock.service';
import { SupplementaryPriceService } from '../../services/supplementary-price.service';
import { of } from 'rxjs';

describe('ArticleManagerComponent', () => {
  let component: ArticleManagerComponent;
  let fixture: ComponentFixture<ArticleManagerComponent>;
  let mockArticleService: jasmine.SpyObj<ArticleService>;
  let mockArticleParamsService: jasmine.SpyObj<ArticleParamsService>;
  let mockArticleHierarchyService: jasmine.SpyObj<ArticleHierarchyService>;
  let mockStockService: jasmine.SpyObj<StockService>;
  let mockSupplementaryPriceService: jasmine.SpyObj<SupplementaryPriceService>;

  beforeEach(async () => {
    // Create mock services
    mockArticleService = jasmine.createSpyObj('ArticleService', [
      'getArticles',
      'createArticle',
      'updateArticle',
      'deleteArticle',
      'getAllData'
    ]);
    mockArticleParamsService = jasmine.createSpyObj('ArticleParamsService', [
      'getParams',
      'getFournisseurs'
    ]);
    mockArticleHierarchyService = jasmine.createSpyObj('ArticleHierarchyService', [
      'getSubfamilies'
    ]);
    mockStockService = jasmine.createSpyObj('StockService', [
      'getAllStockWithArticles',
      'getStockByArticleId',
      'createStock',
      'updateStock',
      'deleteStock'
    ]);
    mockSupplementaryPriceService = jasmine.createSpyObj('SupplementaryPriceService', [
      'getStockWithSupplementaryPrices',
      'createSupplementaryPrice',
      'updateSupplementaryPrice',
      'deleteSupplementaryPrice'
    ]);

    // Setup default mock return values
    mockArticleService.getArticles.and.returnValue(of([]));
    mockArticleService.getAllData.and.returnValue(of([]));
    mockArticleParamsService.getParams.and.returnValue(of([]));
    mockArticleParamsService.getFournisseurs.and.returnValue(of([]));
    mockArticleHierarchyService.getSubfamilies.and.returnValue(of([]));
    mockStockService.getAllStockWithArticles.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [ArticleManagerComponent],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ArticleService, useValue: mockArticleService },
        { provide: ArticleParamsService, useValue: mockArticleParamsService },
        { provide: ArticleHierarchyService, useValue: mockArticleHierarchyService },
        { provide: StockService, useValue: mockStockService },
        { provide: SupplementaryPriceService, useValue: mockSupplementaryPriceService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArticleManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default tab', () => {
    expect(component.activeTab).toBe('browse');
  });

  it('should load articles on init', () => {
    expect(mockArticleService.getArticles).toHaveBeenCalled();
  });

  it('should switch tabs', () => {
    component.setTab('add');
    expect(component.activeTab).toBe('add');

    component.setTab('stock');
    expect(component.activeTab).toBe('stock');
  });
});
