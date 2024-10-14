import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ComponentRef,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  Type,
  viewChild
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
import dragula, { Dragula, Drake } from 'dragula'

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
  templateUrl: './list-cdk3.component.html',
  styleUrl: './list-cdk3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdk3Component implements OnInit {
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
   * @param {HTMLElement} element
   */
  onDragStart(element: HTMLElement): void {

    this.dragDataIndex = Number(element.dataset['index'])
    this.draggedItem = this.items()[this.dragDataIndex]

    if (this.items().some(item => item.expanded)) {
      this.itemsCopy = [...this.items()]
      this.items.update(items => items.map(item => ({...item, expanded: false})))
    }
  }

  /**
   * Handles the drag move event
   * @param {Sortable.MoveEvent} event
   */
  onDragMove(event: Drake): void {
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
    const listElementWrapper: HTMLElement = document.querySelector('.cdk-virtual-scroll-content-wrapper')!

    this.viewportIndexSubscription = this.viewportElement().scrolledIndexChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(index => {
      this.viewportIndex = index
      this.cdr.markForCheck()
    })

    const drag = dragula({
      containers: [listElementWrapper],

    })

    drag.on('drag', (el: Element) => {
      this.dropHandled = false
      this.onDragStart(el as HTMLElement)
    })

    drag.on('drop', (el: Element, target: Element, source: Element, sibling: Element) => {
      console.log('drop')
      this.onDragEnd(sibling as HTMLElement)

      const dropIndex = Number((<HTMLElement>el).dataset['index'])

      if (dropIndex !== this.dragDataIndex) {
        drag.remove()
      }
    })

    drag.on('dragend', (el: Element) => {
      console.log('dragend')
    })

    drag.on('cancel', (el: Element) => {
      console.log('cancel')
    })

    drag.on('cloned', (clone: Element, original: Element, type: 'mirror' | 'copy') => {
      console.log('cloned', type)
    })


    /*Sortable.create(listElementWrapper, {
      animation: 150,
      autoScroll: true,
      scrollSpeed: {y: 10, x: 10},
      scrollThreshold: 50,
      fallbackOnBody: true,
      ghostClass: 'sortable-ghost',
      placeholderClass: 'sortable-placeholder',
      selectedClass: 'sortable-selected',
      chosenClass: 'sortable-chosen',
      swapOnDrop: false,
      // @ts-ignore
      sortDuringScroll: false,
      direction: 'vertical',
      onDrag: (event: any) => {
        this.onDragStart(event)
      },
      onMove: (event: Drake) => {
        this.onDragMove(event)
      },
      onDrop: (event: Drake) => {
        this.onDragEnd(event)
      },
      onChange: (event: Drake) => {
        this.onChange(event)
      },
      onAutoScroll: (event: any) => {
        console.log('scrolling', event)
      }
    })*/
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
          const marginTop = 50
          return (item.expanded ? 100 : 50) + marginTop
        case 'item':
          return item.expanded ? 200 : 34
      }
    })
  }
}
