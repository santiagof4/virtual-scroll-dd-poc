import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  Type,
  viewChild,
  ViewContainerRef
} from '@angular/core'
import { Item } from '../../models/item.model'
import { mockItems } from '../../models/item.mock'
import { ItemComponent } from '../item/item.component'
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport
} from '@angular/cdk/scrolling'
import {
  CustomVirtualScrollDirective
} from '../../directives/custom-virtual-scroll-strategy/custom-virtual-scroll-strategy.directive'
import { ItemDragPreviewComponent } from '../item-drag-preview/item-drag-preview.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Subscription } from 'rxjs'

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
import { DragDropService } from '../../services/drag-drop.service'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'


@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    ItemComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CustomVirtualScrollDirective,
    CdkVirtualScrollableElement
  ],
  templateUrl: './list-cdk4.component.html',
  styleUrl: './list-cdk4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdk4Component implements OnInit {
  private previewComponentRef: ComponentRef<ItemDragPreviewComponent>
  private viewContainerRef = inject(ViewContainerRef)
  private dragDropService = inject(DragDropService)

  private destroyRef = inject(DestroyRef)
  private viewportElement = viewChild.required(CdkVirtualScrollViewport)
  private cdr = inject(ChangeDetectorRef)

  items = signal<Item[]>([])
  itemsCopy: Item[] | undefined

  itemHeights = computed(() => this.getItemsHeights())
  moveEvent = signal<number>(0)
  private dragDataIndex: number
  private hoverDataIndex: number
  draggedItem: Item | undefined
  itemDragPreviewComponent: Type<ItemDragPreviewComponent> = ItemDragPreviewComponent
  private viewportIndexSubscription: Subscription
  private viewportIndex: number
  private dropHandled: boolean

  private offsetCoordinates: { x: number, y: number } = {x: 0, y: 0}
  private marginOffsetCoordinates: { x: number, y: number } = {x: 0, y: 0}

  ngOnInit(): void {
    this.mockData()
    this.initDD()
  }

  /**
   * Updates the item in the list
   * @param updatedItem
   */
  onItemChanged(updatedItem: Item): void {
    this.items.update(items => items.map(i => (i.id === updatedItem.id ? updatedItem : i)))
  }

  /**
   * Tracks the item by its id
   * @param {number} index
   * @param {Item} item
   * @returns {string}
   */
  trackById(index: number, item: Item): string {
    return item.id
  }

  /**
   * Handles the drag start event
   * @param event
   */
  onDragStart(event: BaseEventPayload<ElementDragType>): void {


    if (this.items().some(item => item.expanded)) {
      this.itemsCopy = [...this.items()]
      this.items.update(items => items.map(item => ({...item, expanded: false})))
    }

    const coordinates = {x: event.location.current.input.clientX, y: event.location.current.input.clientY}


    this.showDragPreview({coordinates, item: event.source.data['item'] as Item, element: event.source.element})
  }

  /**
   * Handles the drag move event
   * @param {Sortable.MoveEvent} event
   */
  onDragMove(event: any): void {
    //this.reorderItems(event)
    console.log('move')
  }

  /**
   * Handles the change event
   * @param {Sortable.SortableEvent} event
   */
  onChange(event: any): void {
    this.hoverDataIndex = Number(event.target.dataset['index'])
    //this.reorderItems(event, true)
  }

  /**
   * Handles the drag end event
   * @param {HTMLElement} nextElement
   */
  onDragEnd(nextElement?: HTMLElement): void {
    if (this.itemsCopy) {
      this.items.set(this.itemsCopy)
      this.itemsCopy = undefined
    }

    this.hoverDataIndex = nextElement ? Number(nextElement.dataset['index']) : this.items().length - 1
    this.reorderItems()
  }

  /**
   * Reorders the items in the list
   */
  reorderItems(): void {
    const direction = this.dragDataIndex < this.hoverDataIndex ? 1 : -1
    /*let offset = 0

    if (direction === 1) {
      offset = event.relative === 1 ? 0 : -1
    } else {
      offset = event.relative === 1 ? 1 : 0
    }*/

    const newIndex = direction === 1 ? this.hoverDataIndex - 1 : this.hoverDataIndex

    this.items.update(items => {
      items.splice(this.dragDataIndex, 1)
      items.splice(newIndex, 0, this.draggedItem!)
      return [...items]
    })

    //this.dragDataIndex = newIndex
  }

  /**
   * Sets the input of the component used as drag preview
   * @param {ComponentRef<ItemDragPreviewComponent>} componentRef
   */
  onPreviewCreate(componentRef: ComponentRef<ItemDragPreviewComponent>): void {
    componentRef.setInput('item', this.draggedItem)
  }

  private initDD(): void {
    const listElementWrapper: HTMLElement = document.querySelector('.list-wrapper')!

    this.viewportIndexSubscription = this.viewportElement().scrolledIndexChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(index => {
      this.viewportIndex = index
      this.cdr.markForCheck()
    })

    combine(
      monitorForElements({
        onDragStart: event => this.onDragStart(event),
        onDrag: event => this.onDrag(event),
        onDrop: event => this.onDrop(event)
      }),
      autoScrollForElements({
        element: listElementWrapper,
        getConfiguration: () => ({
          maxScrollSpeed: 'standard'
        })
      })
    )
  }

  /**
   * Mocks the data for the list
   */
  private mockData(): void {
    const mockedItems = mockItems(1000).map((item, i) => ({...item, title: i + ': ' + item.title}))
    this.items.set(mockedItems)
    this.dragDropService.items.set(mockedItems)
  }

  /**
   * Gets the heights of the items for the virtual scroll
   */
  private getItemsHeights(): number[] {
    return this.items().map(item => {
      if (this.dragDropService.dragData()?.id === item.id) {
        return 0
      }

      switch (item.type) {
        case 'header':
          return (item.expanded ? 150 : 100)
        case 'item':
          return item.expanded ? 200 : 34
      }
    })
  }

  /**
   * Shows the drag preview component
   */
  showDragPreview(event: { coordinates: { x: number, y: number }, item: Item, element: HTMLElement }): void {
    this.previewComponentRef = this.viewContainerRef.createComponent(ItemDragPreviewComponent)

    this.offsetCoordinates = {
      x: event.coordinates.x - event.element.getBoundingClientRect().left,
      y: event.coordinates.y - event.element.getBoundingClientRect().top
    }

    if (event.item.type === 'header') {
      this.marginOffsetCoordinates.y = 50
    } else {
      this.marginOffsetCoordinates.y = 0
    }

    this.previewComponentRef.location.nativeElement.style.left = `${event.coordinates.x - this.offsetCoordinates.x + this.marginOffsetCoordinates.x}px`
    this.previewComponentRef.location.nativeElement.style.top = `${event.coordinates.y - this.offsetCoordinates.y + this.marginOffsetCoordinates.y}px`
    this.previewComponentRef.location.nativeElement.style.position = 'fixed'
    this.previewComponentRef.location.nativeElement.style.pointerEvents = 'none'
    this.previewComponentRef.location.nativeElement.style.width = event.element.offsetWidth + 'px'

    this.previewComponentRef.setInput('item', event.item)

    document.body.append(this.previewComponentRef.location.nativeElement)
  }

  private onDrag(event: BaseEventPayload<ElementDragType>) {
    const coordinates = {x: event.location.current.input.clientX, y: event.location.current.input.clientY}

    this.previewComponentRef.location.nativeElement.style.left = `${coordinates.x - this.offsetCoordinates.x + this.marginOffsetCoordinates.x}px`
    this.previewComponentRef.location.nativeElement.style.top = `${coordinates.y - this.offsetCoordinates.y + this.marginOffsetCoordinates.y}px`
  }

  private onDrop(event: BaseEventPayload<ElementDragType>) {
    this.dragDropService.dragData.set(undefined)

    if (this.itemsCopy) {
      this.items.set(this.itemsCopy)
      this.itemsCopy = undefined
    }

    this.removeDragPreview()

    if (
      (!event.location.current.dropTargets.length || !event.location.initial.dropTargets.length) ||
      event.location.current.dropTargets[0].data['item'] === event.location.initial.dropTargets[0].data['item']) {
      return
    }

    const draggedItem = event.location.initial.dropTargets[0].data['item'] as Item
    const draggedIndex = this.items().findIndex(item => item.id === draggedItem.id)

    const closestEdge = extractClosestEdge(event.location.current.dropTargets[0].data)
    const offset = closestEdge === 'top' ? 0 : 1

    this.items.update(items => {
      items.splice(draggedIndex, 1)

      const dropTarget = event.location.current.dropTargets[0].data['item'] as Item
      const dropIndex = this.items().findIndex(item => item.id === dropTarget.id)

      items.splice(dropIndex + offset, 0, draggedItem)
      return [...items]
    })

    this.dragDropService.items.set(this.items())
  }

  private removeDragPreview(): void {
    this.previewComponentRef?.destroy()
    this.previewComponentRef = undefined
  }
}
