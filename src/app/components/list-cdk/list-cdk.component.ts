import { ChangeDetectionStrategy, Component, computed, OnInit, signal, viewChild } from '@angular/core'
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

  ngOnInit(): void {
    this.mockData()
    this.initDD()
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
   * Initializes the drag and drop functionality
   */
  private initDD(): void {
    const virtualScrollWrapper = document.querySelector('.cdk-virtual-scroll-content-wrapper')!
    const listWrapper = document.querySelector('.list-wrapper')!

    Sortable.create(virtualScrollWrapper as HTMLElement, {
      animation: 150,
      scroll: listWrapper as HTMLElement,
      scrollSpeed: 25,
      scrollSensitivity: 50,
      removeCloneOnHide: false,
      onStart: event => {
        this.isDragging.set(true)

        const range = this.viewportElement().getRenderedRange()

        this.draggedItemIndex = event.oldIndex! + range.start

        if (this.items().some(item => item.expanded)) {
          this.itemsCopy = [...this.items()]
          this.items.update(items => items.map(item => ({...item, expanded: false})))
        }
      },
      onEnd: (event) => {
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
    })
  }

  /**
   * Updates the item in the list
   * @param updatedItem
   */
  onItemChanged(updatedItem: Item): void {
    this.items.update(items => items.map(i => (i.id === updatedItem.id ? updatedItem : i)))
  }

  trackById(index: number, item: Item): string {
    return item.id
  }
}
