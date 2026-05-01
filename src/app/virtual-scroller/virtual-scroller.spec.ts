import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualScroller } from './virtual-scroller';

describe('VirtualScroller', () => {
  let component: VirtualScroller;
  let fixture: ComponentFixture<VirtualScroller>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualScroller]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualScroller);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
