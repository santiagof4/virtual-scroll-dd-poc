import { ChangeDetectionStrategy, Component, ComponentRef, computed, OnInit, signal, viewChild } from '@angular/core'
import { Item } from '../../models/item.model'
import { mockItems } from '../../models/item.mock'
import { ItemComponent } from '../item/item.component'
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport
} from '@angular/cdk/scrolling'
import Sortable from 'sortablejs'
import {
  CustomVirtualScrollDirective
} from '../../directives/custom-virtual-scroll-strategy/custom-virtual-scroll-strategy.directive'
import { DragDropDirective } from '../../directives/drag-drop/drag-drop.directive'
import { ItemDragPreviewComponent } from '../item-drag-preview/item-drag-preview.component'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    ItemComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CustomVirtualScrollDirective,
    CdkVirtualScrollableElement,
    DragDropDirective
  ],
  templateUrl: './list-cdk.component.html',
  styleUrl: './list-cdk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdkComponent implements OnInit {
  viewportElement = viewChild.required(CdkVirtualScrollViewport)

  items = signal<Item[]>([])
  itemsCopy: Item[] | undefined

  itemHeights = computed(() => this.getItemsHeights())

  isDragging = signal<boolean>(false)
  private draggedItemIndex: number
  moveEvent = signal<number>(0)
  dragDataIndex = signal<number | undefined>(undefined)
  itemDragPreviewComponent = ItemDragPreviewComponent

  ngOnInit(): void {
    this.mockData()
  }

  /**
   * Mocks the data for the list
   */
  private mockData(): void {
    this.items.set(mockItems(1000))
  }

  /**
   * Gets the heights of the items for the virtual scroll
   */
  private getItemsHeights(): number[] {
    return this.items().map(item => {
      switch (item.type) {
        case 'header':
          const marginTop = 50
          return (item.expanded ? 100 : 50) + marginTop
        case 'item':
          return item.expanded ? 200 : 34
      }
    })
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
   * @param {Sortable.SortableEvent} event
   */
  onDragStart(event: Sortable.SortableEvent): void {
    this.isDragging.set(true)

    const range = this.viewportElement().getRenderedRange()

    this.draggedItemIndex = event.oldIndex! + range.start
    this.dragDataIndex.set(this.draggedItemIndex)

    if (this.items().some(item => item.expanded)) {
      this.itemsCopy = [...this.items()]
      this.items.update(items => items.map(item => ({...item, expanded: false})))
    }
  }

  /**
   * Handles the drag end event
   * @param {Sortable.SortableEvent} event
   */
  onDragEnd(event: Sortable.SortableEvent): void {
    this.isDragging.set(false)

    if (this.itemsCopy) {
      this.items.set(this.itemsCopy)
      this.itemsCopy = undefined
    }

    const range = this.viewportElement().getRenderedRange()

    this.items.update(items => {
      const item = items[this.draggedItemIndex]
      items.splice(this.draggedItemIndex, 1)
      items.splice(event.newIndex! + range.start, 0, item)
      return items
    })
  }

  /**
   * Handles the drag move event
   * @param event
   */
  onDragMove(event: Sortable.MoveEvent) {
    //this.moveEvent.set(event.timeStamp)
  }

  /**
   * Sets the input of the component used as drag preview
   * @param {ComponentRef<ItemDragPreviewComponent>} componentRef
   */
  onPreviewCreate(componentRef: ComponentRef<ItemDragPreviewComponent>): void {
    componentRef.setInput('item', this.items()[this.dragDataIndex()!])
  }
}
