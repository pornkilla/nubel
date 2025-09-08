import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlexroubleComponent } from './flexrouble.component';

describe('FlexroubleComponent', () => {
  let component: FlexroubleComponent;
  let fixture: ComponentFixture<FlexroubleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlexroubleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlexroubleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
