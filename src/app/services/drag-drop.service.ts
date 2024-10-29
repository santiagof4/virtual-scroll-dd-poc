import { ComponentRef, computed, Injectable, signal, ViewContainerRef } from '@angular/core'

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
