import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCdk3Component } from './list-cdk3.component';

describe('ListComponent', () => {
  let component: ListCdk3Component;
  let fixture: ComponentFixture<ListCdk3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCdk3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCdk3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
