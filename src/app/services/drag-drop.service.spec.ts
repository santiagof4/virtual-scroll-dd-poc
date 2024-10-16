import { TestBed } from '@angular/core/testing';

import { DragDropService } from './drag-drop.service';
import { Item } from '../models/item.model'

describe('DragDropService', () => {
  let service: DragDropService<Item>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DragDropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
