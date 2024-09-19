import { ChangeDetectionStrategy, Component, OnInit, signal, viewChild } from '@angular/core'
import { Item } from '../../models/item.model'
import { mockItems } from '../../models/item.mock'
import { ItemComponent } from '../item/item.component'
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop'
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling'
import Sortable from 'sortablejs'
import {
  CustomVirtualScrollDirective
} from '../../directives/custom-virtual-scroll-strategy/custom-virtual-scroll-strategy.directive'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    ItemComponent,
    CdkDropList,
    CdkDrag,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CustomVirtualScrollDirective
  ],
  templateUrl: './list-cdk.component.html',
  styleUrl: './list-cdk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdkComponent implements OnInit {
  viewportElement = viewChild.required(CdkVirtualScrollViewport)

  items: Item[] = []
  itemsCopy: Item[] = []
  itemHeights: number[] = []

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
    this.items = mockItems(1000)
    this.getItemsHeights()
  }

  /**
   * Gets the heights of the items for the virtual scroll
   */
  private getItemsHeights(): void {
    this.itemHeights = this.items.map(item => {
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

    Sortable.create(virtualScrollWrapper as HTMLElement, {
      group: 'shared',
      animation: 150,
      onStart: event => {
        this.isDragging.set(true)

        const range = this.viewportElement().getRenderedRange()

        this.draggedItemIndex = event.oldIndex! + range.start

        this.itemsCopy = [...this.items]
        this.items = this.items.map(item => ({ ...item, expanded: false }))
        this.getItemsHeights()
      },
      onEnd: (event) => {
        this.isDragging.set(false)

        this.items = this.itemsCopy

        const range = this.viewportElement().getRenderedRange()

        moveItemInArray(this.items, this.draggedItemIndex, event.newIndex! + range.start)

        this.items = [...this.items]
        this.getItemsHeights()
      },
      scroll: document.documentElement,
      scrollSpeed: 400,
      scrollSensitivity: 100,
      removeCloneOnHide: false
    })
  }

  /**
   * Updates the item in the list
   * @param updatedItem
   */
  onItemChanged(updatedItem: Item): void {
    this.items = this.items.map(i => (i.id === updatedItem.id ? updatedItem : i))
    this.getItemsHeights()
  }

  drop(event: CdkDragDrop<Item[], any>) {
    moveItemInArray(this.items, event.previousIndex , event.currentIndex);

    this.getItemsHeights()
  }

  trackById(index: number, item: Item): string {
    return item.id
  }
}
