import { TestBed } from '@angular/core/testing';
import { DragDropService } from './drag-drop.service';

type Item = { id: string }

describe('DragDropService', () => {
  let service: DragDropService<Item>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new DragDropService()
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reorder items correctly when dragged item is at the bottom of the drop target', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    service.itemIndexes.set('1', 0);
    service.itemIndexes.set('2', 1);
    service.itemIndexes.set('3', 2);

    const result = service.reorderItems(items, items[0], items[1], 'bottom');

    expect(result.reorderedItems).toEqual([{ id: '2' }, { id: '1' }, { id: '3' }]);
    expect(result.draggedIndex).toBe(0);
    expect(result.dropIndex).toBe(1);
  });

  it('should reorder items correctly when dragged item is at the top of the drop target', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];

    service.itemIndexes.set('1', 0);
    service.itemIndexes.set('2', 1);
    service.itemIndexes.set('3', 2);

    const result = service.reorderItems(items, items[2], items[1], 'top');

    expect(result.reorderedItems).toEqual([{ id: '1' }, { id: '3' }, { id: '2' }]);
    expect(result.draggedIndex).toBe(2);
    expect(result.dropIndex).toBe(1);
  });

  it('should not reorder items if dragged item is the same as drop target', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];

    service.itemIndexes.set('1', 0);
    service.itemIndexes.set('2', 1);
    service.itemIndexes.set('3', 2);

    const result = service.reorderItems(items, items[1], items[1], 'bottom');

    expect(result.reorderedItems).toEqual(items);
    expect(result.draggedIndex).toBe(-1);
    expect(result.dropIndex).toBe(-1);
  });
});
