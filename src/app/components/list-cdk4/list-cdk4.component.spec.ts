import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCdk4Component } from './list-cdk4.component';

describe('ListComponent', () => {
  let component: ListCdk4Component;
  let fixture: ComponentFixture<ListCdk4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCdk4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCdk4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
