import { ChangeDetectionStrategy, Component, OnInit, signal, TrackByFunction, viewChild } from '@angular/core'
import { Item } from '../../models/item.model'
import { mockItems } from '../../models/item.mock'
import {
  DynamicSizeVirtualScrollStrategy, ListRange,
  RxVirtualFor,
  RxVirtualScrollViewportComponent
} from '@rx-angular/template/experimental/virtual-scrolling'
import { ItemComponent } from '../item/item.component'
import Sortable from 'sortablejs'

@Component({
    selector: 'app-list-rx',
    imports: [
        RxVirtualScrollViewportComponent,
        DynamicSizeVirtualScrollStrategy,
        RxVirtualFor,
        ItemComponent
    ],
    templateUrl: './list-rx.component.html',
    styleUrl: './list-rx.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListRxComponent implements OnInit {
  items: Item[] = []
  virtualScrollViewport = viewChild.required(RxVirtualScrollViewportComponent)

  isDragging = signal<boolean>(false)
  viewRange: ListRange

  ngOnInit(): void {
    this.mockData()
    this.subscribeToViewport()
    this.initDD()
  }

  private mockData(): void {
    this.items = mockItems(1000)
  }

  private subscribeToViewport(): void {
    this.virtualScrollViewport().viewRange.subscribe(range => {
      this.viewRange = range
    })
  }

  private initDD(): void {
    // get element with id 'list'
    const sortable = new Sortable(this.virtualScrollViewport().getScrollElement(), {
      group: 'shared',
      animation: 150,
      onEnd: (event) => {
        const item = this.items[event.oldIndex!]
        this.items.splice(event.oldIndex!, 1)
        this.items.splice(event.newIndex!, 0, item)
      }
    })
  }

  dynamicSize(item: Item): number {
    switch (item.type) {
      case 'header':
        const marginTop = 50
        return (item.expanded ? 100 : 50) + marginTop
      case 'item':
        return item.expanded ? 200 : 34
      case 'separator':
        return 10
    }
  }

  /**
   * Updates the item in the list
   * @param updatedItem
   */
  onItemChanged(updatedItem: Item): void {
    this.items = this.items.map(i => (i.id === updatedItem.id ? updatedItem : i))
  }
}
