import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  OnInit,
  signal,
  Type,
  viewChild
} from '@angular/core'
import { HEADER_SIZE, isEmptyGroup, Item, ITEM_SIZE, SEPARATOR_SIZE, SPACE_SIZE } from '../../models/item.model'
import { mockItem, mockItems } from '../../models/item.mock'
import { ItemComponent } from '../item/item.component'
import { CdkVirtualForOf, CdkVirtualScrollableElement, CdkVirtualScrollViewport } from '@angular/cdk/scrolling'
import {
  CustomVirtualScrollDirective
} from '../../directives/custom-virtual-scroll-strategy/custom-virtual-scroll-strategy.directive'
import { DragDirective, DropTargetEvent } from '../../directives/drag/drag.directive'
import { DropDirective } from '../../directives/drop/drop.directive'
import { ItemDragPreviewComponent } from '../item-drag-preview/item-drag-preview.component'
import { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types'

@Component({
  selector: 'app-list',
  imports: [
    ItemComponent,
    CdkVirtualScrollViewport,
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
export class ListCdk4Component implements OnInit, AfterViewInit {
  viewport = viewChild.required(CdkVirtualScrollViewport)

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

  ngAfterViewInit(): void {
    // Workaround for the issue with the virtual scroll not updating the viewport size (cutting off the items)
    setTimeout(() => {
      this.viewport().checkViewportSize()
    }, 100)
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
      switch (item.type) {
        case 'header':
          return (item.expanded ? 150 : HEADER_SIZE)
        case 'item':
          return item.expanded ? 200 : ITEM_SIZE
        case 'separator':
          return SEPARATOR_SIZE
        case 'space':
          return SPACE_SIZE
      }
    })
  }

  /**
   * Updates the items after they have been reordered
   * @param {{ items: Item[]; droppedItem: Item; droppedTargetItem: Item }} event
   */
  onItemsReordered(event: { items: Item[]; droppedItem: Item; droppedTargetItem: Item }): void {
    this.items.set(event.items.map(item => {
      const existingItem = this.items().find(i => i.id === item.id)
      return {
        ...item,
        expanded: existingItem?.expanded ?? false, // Keep the expanded state of the items
        headerId: item.id === event.droppedItem.id ? event.droppedTargetItem.headerId : item.headerId // Update the headerId of the item
      }
    }))

    this.updateSpaceItems()
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

  /**
   * Sets the drag preview inputs
   * @param {ComponentRef<ItemDragPreviewComponent>} componentRef
   * @param {Item} item
   */
  setDragPreviewInputs(componentRef: ComponentRef<ItemDragPreviewComponent>, item: Item): void {
    this.dragPreviewComponentRef = componentRef
    componentRef.setInput('item', item)
  }

  /**
   * Handles the drag target dragged event
   * @param {DropTargetEvent<Partial<Item>>} event
   */
  onDropTargetDragged(event: DropTargetEvent<Partial<Item>>): void {
    this.dragPreviewComponentRef.setInput('dropItem', event.dropData)
    this.dragPreviewComponentRef.setInput('dropEdge', event.closestEdge)
    this.dragPreviewComponentRef.setInput('isIndented', event.indented)
  }

  /**
   * Determines if the item can be dropped at the target
   * @param {Item} dragItem
   * @param {Item} dropTargetItem
   * @returns {boolean}
   */
  canDrop(dragItem: Item, dropTargetItem: Item): boolean {
    const dropItemIndex = this.items().findIndex(item => item.id === dropTargetItem.id)

    if (dropTargetItem.type === 'separator') {
      return false
    }

    // Headers can be dropped only on another header or at the top
    if (dragItem.type === 'header') {
      return dragItem.type === dropTargetItem.type && dropItemIndex === 0
    }

    // Items can be dropped only after another item
    if (dragItem.type === 'item') {
      return (dragItem.type === dropTargetItem.type && dropItemIndex > 0) || dropTargetItem.type === 'space'
    }

    return false
  }

  /**
   * Adds a space items next to empty groups
   * Removes the space items if they are not needed
   */
  private updateSpaceItems(): void {
    this.items.update(items => {
      items.forEach((item, i) => {
        if (item.type === 'header') {
          if (isEmptyGroup(items, item)) {
            if (items[i + 1]?.type !== 'space') {
              items.splice(i + 1, 0, mockItem('space', item.id))
            }
          } else if (items[i + 1]?.type === 'space') {
            items.splice(i + 1, 1)
          }
        }
      })

      return items
    })
  }
}
