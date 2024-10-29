import {
  AfterViewInit,
  ComponentRef,
  computed,
  Directive,
  ElementRef,
  HostBinding,
  inject,
  input,
  OnDestroy,
  output,
  Type
} from '@angular/core'
import { DragDropService } from '../../services/drag-drop.service'
import type { SafeStyle } from '@angular/platform-browser'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements, ElementDropTargetEventBasePayload } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { attachClosestEdge, Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { BaseEventPayload, ElementDragType, Input } from '@atlaskit/pragmatic-drag-and-drop/types'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'

interface DropTargetEventInfo<I> {
  dragData: I
  dropData: I
  closestEdge: Edge
  indented: boolean
}

export type DropTargetEvent<I> = ElementDropTargetEventBasePayload & DropTargetEventInfo<I>

@Directive({
  selector: '[appDrag]',
  standalone: true
})
export class DragDirective<I extends { id: string }, C = any> implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef)
  private dragDropService = inject(DragDropService<I>, {host: true})

  dragItem = input.required<I>()
  dragPlaceholderSize = input<{ width?: number, height?: number }>()
  dragDisableNativePreview = input<boolean>()
  dragAllowedEdges = input<Edge[]>()
  dragCanDrag = input<boolean | ((dragItem: I) => boolean)>(true)
  dragCanDrop = input<boolean | ((dragItem: I, dropTargetItem: I) => boolean)>(true)
  dragPreviewComponent = input<Type<C>>()
  dragPreviewOffset = input<{ x: number, y: number }>({x: 0, y: 0})
  dragIndentThreshold = input<number>()

  onDragStarted = output<BaseEventPayload<ElementDragType>>()
  onDragged = output<BaseEventPayload<ElementDragType>>()
  onDragPreviewCreated = output<ComponentRef<C>>()
  onDropped = output<BaseEventPayload<ElementDragType>>()

  onDropTargetDragged = output<DropTargetEvent<I>>()
  onDropTargetDragEntered = output<DropTargetEvent<I>>()
  onDropTargetDragLeft = output<DropTargetEvent<I>>()
  onDropTargetDropped = output<DropTargetEvent<I>>()

  private dragItemIndex = computed(() => this.dragDropService.itemIndexes.get(this.dragItem().id))

  private destroyed: boolean

  /**
   * Applies styles for the dragging item and the item being dragged over
   */
  @HostBinding('style')
  get draggingStyle(): SafeStyle {
    const style: Partial<CSSStyleDeclaration> = {}

    if (this.dragDropService.isDragging()) {
      style.transition = 'transform 0.2s'
    }

    // Dragging item hiding
    if (this.dragDropService.dragData()?.id === this.dragItem().id) {
      style.opacity = '0'
    }

    // Drop placeholder
    if (this.dragDropService.dragData() && this.dragDropService.draggingOverItem()) {
      const {dragInitialIndex, dragOverIndex, itemIndex} = {
        dragInitialIndex: this.dragDropService.dragInitialIndex(),
        dragOverIndex: this.dragDropService.dragOverIndex(),
        itemIndex: this.dragItemIndex()
      }

      const placeholderSize = this.dragDropService.placeholderSize()

      if (this.dragDropService.dragDirection() === 'down') {
        if (itemIndex > dragInitialIndex && itemIndex <= dragOverIndex) {
          style.transform = `translateY(-${placeholderSize.height}px)`
        } else if (itemIndex <= dragInitialIndex && itemIndex > dragOverIndex) {
          style.transform = `translateY(${placeholderSize.height}px)`
        }
      } else if (this.dragDropService.dragDirection() === 'up') {
        if (itemIndex < dragInitialIndex && itemIndex >= dragOverIndex) {
          style.transform = `translateY(${placeholderSize.height}px)`
        } else if (itemIndex >= dragInitialIndex && itemIndex < dragOverIndex) {
          style.transform = `translateY(-${placeholderSize.height}px)`
        }
      }
    }

    return style
  }

  ngAfterViewInit(): void {
    this.initDragAndDrop()
  }

  ngOnDestroy(): void {
    this.destroyed = true
  }

  /**
   * Initializes the drag and drop functionality
   */
  private initDragAndDrop(): void {
    combine(
      draggable({
        element: this.elementRef.nativeElement,
        getInitialData: () => this.getInitialData(),
        canDrag: () => this.canDrag(),
        onGenerateDragPreview: event => this.onGenerateDragPreview(event),
        onDragStart: event => this.onDragStart(event),
        onDrag: event => this.onDrag(event),
        onDrop: event => this.onDrop(event)
      }),
      dropTargetForElements({
        element: this.elementRef.nativeElement,
        getIsSticky: () => true,
        getData: args => this.getData(args),
        canDrop: () => this.canDrop(),
        onDrag: event => this.onDropTargetDrag(event),
        onDragEnter: event => this.onDropTargetDragEnter(event),
        onDragLeave: event => this.onDropTargetDragLeave(event),
        onDrop: event => this.onDropTargetDrop(event)
      })
    )
  }

  /** Drag config and event handlers */

  /**
   * Sets the initial data for the drag
   * @returns { item: <I> }
   */
  private getInitialData(): { item: I } {
    this.dragDropService.dragData.set(this.dragItem())

    return {item: this.dragItem()}
  }

  /**
   * Determines if the item can be dragged
   * @returns {boolean}
   */
  private canDrag(): boolean {
    const canDrag = this.dragCanDrag()

    return typeof canDrag === 'boolean' ? canDrag : canDrag(this.dragItem())
  }

  /**
   * Disables the native drag preview if the input is set to true
   * @param {BaseEventPayload<ElementDragType> & { nativeSetDragImage: (image: Element, x: number, y: number) => void }} event
   */
  private onGenerateDragPreview(event: BaseEventPayload<ElementDragType> & {
    nativeSetDragImage: (image: Element, x: number, y: number) => void
  }): void {
    if (this.dragPreviewComponent()) {
      disableNativeDragPreview({nativeSetDragImage: event.nativeSetDragImage})

      const coordinates = {x: event.location.current.input.clientX, y: event.location.current.input.clientY}
      this.showDragPreview({coordinates, element: event.source.element})
    }
  }

  /**
   * Handles the drag start event
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDragStart(event: BaseEventPayload<ElementDragType>): void {
    this.dragDropService.isDragging.set(true)
    this.dragDropService.dragDataSize.set({
      width: event.source.element.offsetWidth,
      height: event.source.element.offsetHeight
    })
    this.dragDropService.dragPosition.set({
      x: event.location.current.input.clientX,
      y: event.location.current.input.clientY
    })
    this.dragDropService.dragInitialPosition.set({
      x: event.location.current.input.clientX,
      y: event.location.current.input.clientY
    })
    this.dragDropService.placeholderSize.set(this.dragPlaceholderSize() || this.dragDropService.dragDataSize())

    preventUnhandled.start()

    this.onDragStarted.emit(event)
  }

  /**
   * Handles the drag event
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDrag(event: BaseEventPayload<ElementDragType>): void {
    const coordinates = {x: event.location.current.input.clientX, y: event.location.current.input.clientY}

    if (!this.dragDropService.previewComponentRef) {
      return
    }

    this.dragDropService.previewComponentRef.location.nativeElement.style.left = `${coordinates.x - this.dragDropService.previewOffset.x + this.dragPreviewOffset().x}px`
    this.dragDropService.previewComponentRef.location.nativeElement.style.top = `${coordinates.y - this.dragDropService.previewOffset.y + this.dragPreviewOffset().y}px`

    if (!this.destroyed) {
      this.onDragged.emit(event)
    }
  }

  /**
   * Handles the drop event
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDrop(event: BaseEventPayload<ElementDragType>): void {
    if (!this.destroyed) {
      this.onDropped.emit(event)
    }
  }

  /** Drop target config and event handlers **/

  /**
   * Drop target config and event handlers
   * Sets the data for the drop target.
   * It also configures the allowed edges for the drop target
   * @param {Input} input
   * @param {Element} element
   */
  private getData({input, element}: { input: Input, element: Element }): Record<string | symbol, unknown> {
    let data: Record<string | symbol, unknown> = { item: this.dragItem() }

    if (this.dragAllowedEdges()?.length) {
      data = attachClosestEdge(data, {
        input,
        element,
        allowedEdges: this.dragAllowedEdges()
      })
    }

    return data
  }

  /**
   * Determines if an item can be dropped on the drop target
   * @returns {boolean}
   */
  private canDrop(): boolean {
    const canDrop = this.dragCanDrop()

    return typeof canDrop === 'boolean' ? canDrop : canDrop(this.dragDropService.dragData(), this.dragItem())
  }

  /**
   * Handles the drag event on the drop target
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDropTargetDrag(event: ElementDropTargetEventBasePayload): void {
    if (!this.dragDropService.dragMoved()) {
      const currentPositionItem = event.location.current.dropTargets[0]?.data['item'] as I
      const initialPositionItem = event.location.initial.dropTargets[0]?.data['item'] as I

      this.dragDropService.dragMoved.set(currentPositionItem?.id !== initialPositionItem?.id)
    }

    const currentPosition = {x: event.location.current.input.clientX, y: event.location.current.input.clientY}

    if (currentPosition.y !== this.dragDropService.dragPosition().y) {
      const direction = currentPosition.y > this.dragDropService.dragPosition().y ? 'down' : 'up'

      if (this.dragDropService.dragDirectionChange() !== direction) {
        this.dragDropService.dragDirectionChange.set(direction)
        this.dragDropService.dragDirectionChangeCoordinates.set(currentPosition)
      }

      // Check if the drag direction has changed at in at least 10px
      if ((!this.dragDropService.dragDirection() || Math.abs(currentPosition.y - this.dragDropService.dragDirectionChangeCoordinates().y) > 10)) {
        this.dragDropService.dragDirection.set(direction)
      }
    }

    this.dragDropService.dragPosition.set(currentPosition)

    this.onDropTargetDragged.emit(this.getDropTargetEventInfo(event))
  }

  /**
   * Handles the drag enter event on the drop target
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDropTargetDragEnter(event: ElementDropTargetEventBasePayload): void {
    this.dragDropService.draggingOverItem.set(this.dragItem())

    this.onDropTargetDragEntered.emit(this.getDropTargetEventInfo(event))
  }

  /**
   * Handles the drag leave event on the drop target
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDropTargetDragLeave(event: ElementDropTargetEventBasePayload): void {
    if (!this.destroyed) {
      this.onDropTargetDragLeft.emit(this.getDropTargetEventInfo(event))
    }
  }

  /**
   * Handles the drop event on the drop target
   * @param {BaseEventPayload<ElementDragType>} event
   */
  private onDropTargetDrop(event: ElementDropTargetEventBasePayload): void {
    if (!this.destroyed) {
      this.onDropped.emit(this.getDropTargetEventInfo(event))
    }
  }

  /**
   * Shows the drag preview component
   */
  private showDragPreview(event: { coordinates: { x: number, y: number }, element: HTMLElement }): void {
    this.dragDropService.previewComponentRef = this.dragDropService.viewContainerRef.createComponent(this.dragPreviewComponent())

    this.dragDropService.previewOffset = {
      x: event.coordinates.x - event.element.getBoundingClientRect().left,
      y: event.coordinates.y - event.element.getBoundingClientRect().top
    }

    this.dragDropService.previewComponentRef.location.nativeElement.style.left = `${event.coordinates.x - this.dragDropService.previewOffset.x + this.dragPreviewOffset().x}px`
    this.dragDropService.previewComponentRef.location.nativeElement.style.top = `${event.coordinates.y - this.dragDropService.previewOffset.y + this.dragPreviewOffset().y}px`
    this.dragDropService.previewComponentRef.location.nativeElement.style.position = 'fixed'
    this.dragDropService.previewComponentRef.location.nativeElement.style.pointerEvents = 'none'
    this.dragDropService.previewComponentRef.location.nativeElement.style.width = event.element.offsetWidth + 'px'

    document.body.append(this.dragDropService.previewComponentRef.location.nativeElement)

    this.onDragPreviewCreated.emit(this.dragDropService.previewComponentRef)
  }

  /**
   * Determines if the user drags the element to the right more than the threshold in px.
   * @param {number} elementX
   * @returns {boolean}
   */
  private getIndentDrag(elementX: number): boolean {
    return this.dragDropService.dragInitialPosition() && this.dragIndentThreshold() > 0
      ? elementX - this.dragDropService.dragInitialPosition().x > this.dragIndentThreshold()
      : false
  }

  /**
   * Gets the drop target event extra info and adds it to the original event
   * @param {ElementDropTargetEventBasePayload} event
   * @returns {DropTargetEvent<I>}
   */
  private getDropTargetEventInfo(event: ElementDropTargetEventBasePayload): DropTargetEvent<I> {
    const dragData = event.source.data?.['item'] as I
    let dropData: I
    let closestEdge: Edge
    let indented: boolean

    dropData = event.self.data['item'] as I
    closestEdge = extractClosestEdge(event.self.data)

    if (this.dragIndentThreshold() > 0) {
      indented = this.getIndentDrag(event.location.current.input.clientX)
    }

    return {...event, dragData, dropData, closestEdge, indented }
  }
}
