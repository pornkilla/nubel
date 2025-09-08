import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColormatchComponent } from './colormatch.component';

describe('ColormatchComponent', () => {
  let component: ColormatchComponent;
  let fixture: ComponentFixture<ColormatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColormatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColormatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
