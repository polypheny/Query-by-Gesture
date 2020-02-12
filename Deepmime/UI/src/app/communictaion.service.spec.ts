import { TestBed } from '@angular/core/testing';

import { CommunictaionService } from './communictaion.service';

describe('CommunictaionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CommunictaionService = TestBed.get(CommunictaionService);
    expect(service).toBeTruthy();
  });
});
