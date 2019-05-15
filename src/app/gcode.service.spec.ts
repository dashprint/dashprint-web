import { TestBed } from '@angular/core/testing';

import { GCodeService } from './gcode.service';

describe('GCodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GCodeService = TestBed.get(GCodeService);
    expect(service).toBeTruthy();
  });
});
