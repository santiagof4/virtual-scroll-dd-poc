import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCdk2Component } from './list-cdk2.component';

describe('ListComponent', () => {
  let component: ListCdk2Component;
  let fixture: ComponentFixture<ListCdk2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCdk2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCdk2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
