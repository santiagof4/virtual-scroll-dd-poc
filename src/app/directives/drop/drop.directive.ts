import { AfterViewInit, Directive, inject, input, model, output, ViewContainerRef } from '@angular/core'
import { DragDropService } from '../../services/drag-drop.service'

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

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
  onItemsReordered = output<I[]>()

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
    this.dragDropService.dragData.set(undefined)
    this.removeDragPreview()

    this.onDropped.emit(event)

    this.reorderItems(event)
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
    if (
      (!event.location.current.dropTargets.length || !event.location.initial.dropTargets.length) ||
      event.location.current.dropTargets[0].data['item'] === event.location.initial.dropTargets[0].data['item']) {
      return
    }

    const draggedItem = event.location.initial.dropTargets[0].data['item'] as I
    const draggedIndex = this.dropItems().findIndex(item => item.id === draggedItem.id)

    const closestEdge = extractClosestEdge(event.location.current.dropTargets[0].data)
    const offset = closestEdge === 'top' ? 0 : 0

    this.dropItems.update(items => {
      items.splice(draggedIndex, 1)

      const dropTarget = event.location.current.dropTargets[0].data['item'] as I
      const dropIndex = this.dropItems().findIndex(item => item.id === dropTarget.id)

      items.splice(dropIndex + offset, 0, draggedItem)
      return [...items]
    })

    this.onItemsReordered.emit(this.dropItems())
  }
}
