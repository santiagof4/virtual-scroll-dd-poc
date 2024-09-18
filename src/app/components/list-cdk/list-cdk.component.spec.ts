import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCdkComponent } from './list-cdk.component';

describe('ListComponent', () => {
  let component: ListCdkComponent;
  let fixture: ComponentFixture<ListCdkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCdkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCdkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
