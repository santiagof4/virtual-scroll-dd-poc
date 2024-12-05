import { AfterViewInit, Directive, effect, inject, input, model, output, ViewContainerRef } from '@angular/core'
import { DragDropService } from '../../services/drag-drop.service'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
import { Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

export interface ReorderedEvent<I> {
  items: I[];
  droppedItem: I
  droppedItemIndex: number
  droppedTargetItem: I;
  droppedTargetItemIndex: number
  closestEdge: Edge
}

@Directive({
  selector: '[appDrop]',
  providers: [DragDropService],
  standalone: true
})
export class DropDirective<I extends { id: string }> implements AfterViewInit {
  private viewContainerRef = inject(ViewContainerRef)
  private dragDropService = inject(DragDropService)

  dropItems = model.required<I[]>()
  dropScrollingElementSelector = input<string>()

  onDragStarted = output<BaseEventPayload<ElementDragType>>()
  onDragged = output<BaseEventPayload<ElementDragType>>()
  onDropped = output<BaseEventPayload<ElementDragType>>()
  onItemsReordered = output<ReorderedEvent<I>>()

  constructor() {
    effect(() => {
      this.dragDropService.itemIndexes.clear()
      this.dropItems().forEach((item, index) => {
        this.dragDropService.itemIndexes.set(item.id, index)
      })
    })
  }

  ngAfterViewInit(): void {
    this.initDragDrop()
  }

  /**
   * Initializes the drag and drop functionality
   */
  private initDragDrop(): void {
    const scrollingElement: HTMLElement | Element =
      document.querySelector(this.dropScrollingElementSelector()) || document.scrollingElement!

    combine(
      monitorForElements({
        onDragStart: event => this.onDragStart(event),
        onDrag: event => this.onDrag(event),
        onDrop: event => this.onDrop(event)
      }),
      autoScrollForElements({
        element: scrollingElement,
        getConfiguration: () => ({
          maxScrollSpeed: 'standard'
        })
      })
    )

    this.dragDropService.viewContainerRef = this.viewContainerRef
  }

  /**
   * Handles the drag start event of any draggable element
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDragStart(event: BaseEventPayload<ElementDragType>): void {
    this.onDragStarted.emit(event)
  }

  /**
   * Handles the drag event of any draggable element
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDrag(event: BaseEventPayload<ElementDragType>) {
    this.onDragged.emit(event)
  }

  /**
   * Handles the drop event of any draggable element
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDrop(event: BaseEventPayload<ElementDragType>) {
    this.removeDragPreview()

    this.onDropped.emit(event)

    this.reorderItems(event)

    this.dragDropService.reset()
  }

  /**
   * Destroys the drag preview component
   */
  private removeDragPreview(): void {
    this.dragDropService.previewComponentRef?.destroy()
    this.dragDropService.previewComponentRef = undefined
  }

  /**
   * Reorders the items based on the drag and drop event
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private reorderItems(event: BaseEventPayload<ElementDragType>): void {
    const draggedItem = event.location.initial.dropTargets[0]?.data['item'] as I
    const dropTargetItem = event.location.current.dropTargets[0]?.data['item'] as I

    if (!draggedItem || !dropTargetItem || draggedItem.id === dropTargetItem.id) {
      return
    }

    const draggedIndex = this.dragDropService.itemIndexes.get(draggedItem.id)
    const dropIndex = this.dragDropService.itemIndexes.get(dropTargetItem.id)

    const direction = draggedIndex < dropIndex! ? -1 : 0

    const closestEdge = extractClosestEdge(event.location.current.dropTargets[0].data)
    const offset = closestEdge === 'top' ? 0 : 1

    this.dropItems.update(items => {
      items.splice(draggedIndex, 1)

      items.splice(dropIndex + offset + direction, 0, draggedItem)
      return [...items]
    })

    this.onItemsReordered.emit({
      items: this.dropItems(),
      droppedItem: draggedItem,
      droppedItemIndex: draggedIndex,
      droppedTargetItem: dropTargetItem,
      droppedTargetItemIndex: dropIndex,
      closestEdge
    })
  }
}
