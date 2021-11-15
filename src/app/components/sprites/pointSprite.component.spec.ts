import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PointSpriteComponent } from './pointSprite.component';

describe('PointSpriteComponent', () => {
  let component: PointSpriteComponent;
  let fixture: ComponentFixture<PointSpriteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PointSpriteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PointSpriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
