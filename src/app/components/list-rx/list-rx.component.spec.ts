import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRxComponent } from './list-rx.component';

describe('ListComponent', () => {
  let component: ListRxComponent;
  let fixture: ComponentFixture<ListRxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListRxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListRxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
