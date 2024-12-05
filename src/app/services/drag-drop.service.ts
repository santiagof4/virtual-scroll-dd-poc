import { ComponentRef, computed, Injectable, signal, ViewContainerRef } from '@angular/core'
import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

@Injectable()
export class DragDropService<I extends { id: string }> {
  itemIndexes = new Map<string, number>()

  isDragging = signal(false)
  dragMoved = signal(false)
  draggingOverItem = signal<I | undefined>(undefined)
  dragData = signal<I | undefined>(undefined)
  dragDataSize = signal<{ width: number; height: number } | undefined>(undefined)
  placeholderSize = signal<{ width?: number; height?: number } | undefined>(undefined)

  dragPosition = signal<{ x: number; y: number } | undefined>(undefined)
  dragInitialPosition = signal<{ x: number; y: number } | undefined>(undefined)
  dragDirection = signal<'up' | 'down' | undefined>(undefined)
  dragDirectionChange = signal<'up' | 'down' | undefined>(undefined)
  dragDirectionChangeCoordinates = signal<{ x: number; y: number } | undefined>(undefined)

  viewContainerRef: ViewContainerRef
  previewComponentRef: ComponentRef<any>
  previewOffset: { x: number; y: number }

  dragInitialIndex = computed(() => this.itemIndexes.get(this.dragData().id))
  dragOverIndex = computed(() => this.itemIndexes.get(this.draggingOverItem().id))

  /**
   * Reorders the items in the array based on the drag and drop operation.
   * @param {I[]} items
   * @param {I} draggedItem
   * @param {I} dropTargetItem
   * @param {Edge} closestEdge
   * @returns {{ reorderedItems: I[], draggedIndex: number, dropIndex: number }}
   */
  reorderItems(items: I[], draggedItem: I, dropTargetItem: I, closestEdge: Edge): {
    reorderedItems: I[],
    draggedIndex: number,
    dropIndex: number
  } {
    if (!draggedItem || !dropTargetItem || draggedItem.id === dropTargetItem.id) {
      return {reorderedItems: items, draggedIndex: -1, dropIndex: -1}
    }

    const draggedIndex = this.itemIndexes.get(draggedItem.id)
    const dropIndex = this.itemIndexes.get(dropTargetItem.id)

    const direction = draggedIndex < dropIndex! ? -1 : 0
    const offset = closestEdge === 'top' ? 0 : 1

    const reorderedItems = [...items]
    reorderedItems.splice(draggedIndex, 1)
    reorderedItems.splice(dropIndex + offset + direction, 0, draggedItem)

    return {reorderedItems, draggedIndex, dropIndex}
  }

  /**
   * Resets the state.
   * This method should be called when the drag and drop operation is completed.
   */
  reset(): void {
    this.isDragging.set(false)
    this.dragMoved.set(false)
    this.draggingOverItem.set(undefined)
    this.dragData.set(undefined)
    this.dragDataSize.set(undefined)
    this.dragPosition.set(undefined)
    this.dragInitialPosition.set(undefined)
    this.dragDirection.set(undefined)
    this.dragDirectionChange.set(undefined)
    this.dragDirectionChangeCoordinates.set(undefined)
    this.placeholderSize.set(undefined)
    this.previewComponentRef = undefined
    this.previewOffset = undefined
  }
}
