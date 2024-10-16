import { ChangeDetectionStrategy, Component, ComponentRef, computed, OnInit, signal, Type } from '@angular/core'
import { HEADER_SIZE, Item, ITEM_SIZE } from '../../models/item.model'
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
import { DragDirective } from '../../directives/drag/drag.directive'
import { DropDirective } from '../../directives/drop/drop.directive'
import { ItemDragPreviewComponent } from '../item-drag-preview/item-drag-preview.component'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
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
    CdkVirtualScrollableElement,
    DragDirective,
    DropDirective
  ],
  templateUrl: './list-cdk4.component.html',
  styleUrl: './list-cdk4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdk4Component implements OnInit {
  items = signal<Item[]>([])
  itemsCopy: Item[] | undefined

  itemHeights = computed(() => this.getItemsHeights())
  draggedItem = signal<Item | undefined>(undefined)

  protected readonly ITEM_SIZE = ITEM_SIZE
  protected readonly HEADER_SIZE = HEADER_SIZE
  protected readonly ItemDragPreviewComponent: Type<ItemDragPreviewComponent> = ItemDragPreviewComponent
  private dragPreviewComponentRef: ComponentRef<ItemDragPreviewComponent>

  ngOnInit(): void {
    this.mockData()
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
   * Mocks the data for the list
   */
  private mockData(): void {
    const mockedItems = mockItems(1000).map((item, i) => ({...item, title: i + ': ' + item.title}))
    this.items.set(mockedItems)
  }

  /**
   * Gets the heights of the items for the virtual scroll
   */
  private getItemsHeights(): number[] {
    return this.items().map(item => {
      if (this.draggedItem()?.id === item.id) {
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
   * Updates the items after they have been reordered
   * @param {Item[]} items
   */
  onItemsReordered(items: Item[]): void {
    // Keep the expanded state of the items
    this.items.set(items.map(item => {
      const existingItem = this.items().find(i => i.id === item.id)
      return {...item, expanded: existingItem?.expanded ?? false}
    }))
  }

  /**
   * Handles the drag start event
   * @param {Item} item
   */
  onDragStarted(item: Item): void {
    this.draggedItem.set(item)

    // Collapse all items
    this.itemsCopy = [...this.items()]
    this.items.update(items => items.map(i => ({...i, expanded: false})))
  }

  /**
   * Handles the drop event
   */
  onDropped(): void {
    this.draggedItem.set(undefined)

    // Restore expand state of items
    if (!this.itemsCopy) {
      return
    }

    this.items.set([...this.itemsCopy])
    this.itemsCopy = undefined
  }

  setDragPreviewInputs(componentRef: ComponentRef<ItemDragPreviewComponent>, item: Item): void {
    this.dragPreviewComponentRef = componentRef
    componentRef.setInput('item', item)
  }

  onDropTargetDragged(event: BaseEventPayload<ElementDragType>): void {
    try {
      const closestEdge = extractClosestEdge(event.location.current.dropTargets[0]?.data)

      this.dragPreviewComponentRef.setInput('dropItem', event.location.current.dropTargets[0]?.data['item'])
      this.dragPreviewComponentRef.setInput('dropEdge', closestEdge)
    } catch (_) {}
  }
}
