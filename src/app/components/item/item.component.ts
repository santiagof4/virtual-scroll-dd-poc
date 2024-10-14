import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  inject,
  model,
  output,
  signal
} from '@angular/core'
import { HEADER_SIZE, Item, ITEM_SIZE } from '../../models/item.model'

import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
import { attachClosestEdge, Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DragDropService } from '../../services/drag-drop.service'
import { SafeStyle } from '@angular/platform-browser'

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent implements AfterViewInit {
  private elementRef = inject(ElementRef)
  private dragDropService = inject(DragDropService)

  item = model.required<Item>()

  onDragStarted = output<{ coordinates: { x: number, y: number }, item: Item, element: HTMLElement }>()

  isDraggingOver = signal(false)

  closestEdgeOfDraggingTarget = signal<Edge | null>(null)

  @HostBinding('class')
  get typeClass() {
    return this.item().type
  }

  @HostBinding('class.expanded')
  get expandedClass() {
    return this.item().expanded
  }

  @HostBinding('style')
  get draggingStyle(): SafeStyle {
    const style: Partial<CSSStyleDeclaration> = {}

    if (this.dragDropService.isDragging()) {
      style.transition = 'margin 0.2s'
    }

    if (this.dragDropService.draggingOverItem()?.id === this.item().id && this.dragDropService.dragData()) {
      const marginSize = this.dragDropService.dragData().type === 'header' ? HEADER_SIZE : ITEM_SIZE

      style.marginTop = `${marginSize}px`
    }

    if (this.dragDropService.dragData()?.id === this.item().id) {
      style.opacity = '0'
    }

    if (
      this.dragDropService.isDragging() &&
      this.dragDropService.dragMoved() &&
      this.dragDropService.dragData()?.id === this.item().id
    ) {
      style.height = '0px'
      style.padding = '0px'
      style.border = 'none'
      style.margin = '0px'
      style.transition = 'height 0.2s, padding 0.2s, border 0.2s, margin 0.2s'
    }

    return style
  }

  ngAfterViewInit() {
    this.initDD()
  }

  private initDD() {
    combine(
      draggable({
        element: this.elementRef.nativeElement,
        onDragStart: event => {
          this.onDragStart(event)
        },
        onGenerateDragPreview: nativeSetDragImage => {
          disableNativeDragPreview({nativeSetDragImage: nativeSetDragImage.nativeSetDragImage})
        },
        getInitialData: () => {
          this.dragDropService.dragData.set(this.item())
          return {item: this.item()}
        }
      }),
      dropTargetForElements({
        element: this.elementRef.nativeElement,
        onDragEnter: event => {
          this.isDraggingOver.set(true)
          this.dragDropService.draggingOverItem.set(this.item())
          this.closestEdgeOfDraggingTarget.set(extractClosestEdge(event.self.data))
        },
        onDragLeave: event => {
          this.isDraggingOver.set(false)
          this.closestEdgeOfDraggingTarget.set(null)
        },
        onDrag: event => {
          const dragMoved = event.location.current.dropTargets[0]?.data['item'] !== event.location.initial.dropTargets[0]?.data['item']
          this.dragDropService.dragMoved.set(dragMoved)
        },
        onDrop: () => {
          this.isDraggingOver.set(false)
          this.dragDropService.isDragging.set(false)
          this.dragDropService.draggingOverItem.set(undefined)
          this.closestEdgeOfDraggingTarget.set(null)
          this.dragDropService.dragMoved.set(false)
        },
        getIsSticky: () => true,
        getData: ({input, element}) => {
          const data = {item: this.item()}

          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['top', 'bottom']
          })
        }
      })
    )
  }

  /**
   * Toggles the expanded state of the item
   */
  toggleExpand() {
    this.item.update(item => ({...item, expanded: !item.expanded}))
  }

  private onDragStart(event: BaseEventPayload<ElementDragType>) {
    this.dragDropService.isDragging.set(true)
    preventUnhandled.start()

    const coordinates = {x: event.location.initial.input.clientX, y: event.location.initial.input.clientY}
    this.onDragStarted.emit({coordinates, item: this.item(), element: this.elementRef.nativeElement})
  }
}
