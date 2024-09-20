import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemDragPreviewComponent } from './item-drag-preview.component';

describe('ItemDragPreviewComponent', () => {
  let component: ItemDragPreviewComponent;
  let fixture: ComponentFixture<ItemDragPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDragPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemDragPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
