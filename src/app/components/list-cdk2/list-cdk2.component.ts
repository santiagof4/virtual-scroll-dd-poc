import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ComponentRef,
  computed,
  DestroyRef, HostListener,
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
  CdkVirtualForOf,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport
} from '@angular/cdk/scrolling'
import {
  CustomVirtualScrollDirective
} from '../../directives/custom-virtual-scroll-strategy/custom-virtual-scroll-strategy.directive'
import { ItemDragPreviewComponent } from '../item-drag-preview/item-drag-preview.component'
import Sortable, { SortableEvent } from 'sortable-dnd'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Subscription } from 'rxjs'

@Component({
    selector: 'app-list',
    imports: [
        ItemComponent,
        CdkVirtualScrollViewport,
        CdkVirtualForOf,
        CustomVirtualScrollDirective,
        CdkVirtualScrollableElement
    ],
    templateUrl: './list-cdk2.component.html',
    styleUrl: './list-cdk2.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListCdk2Component implements OnInit {
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
   * @param {Sortable.SortableEvent} event
   */
  onDragStart(event: SortableEvent): void {

    this.dragDataIndex = Number(event.node.dataset['index'])
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
  onDragMove(event: SortableEvent): void {
    //this.reorderItems(event)
  }

  /**
   * Handles the change event
   * @param {Sortable.SortableEvent} event
   */
  onChange(event: SortableEvent): void {
    this.hoverDataIndex = Number(event.target.dataset['index'])
    this.reorderItems(event, true)
  }

  /**
   * Handles the drag end event
   * @param {Sortable.SortableEvent} event
   */
  onDragEnd(event: SortableEvent): void {
    if (this.itemsCopy) {
      this.items.set(this.itemsCopy)
      this.itemsCopy = undefined
    }

    this.reorderItems(event)
  }

  /**
   * Reorders the items in the list
   * @param {SortableEvent} event
   * @param {boolean} sizeOnly
   */
  reorderItems(event: SortableEvent, sizeOnly?: boolean): void {
    if (event.relative === 0) {
      return
    }

    const direction = this.dragDataIndex < this.hoverDataIndex ? 1 : -1
    let offset = 0

    if (direction === 1) {
      offset = event.relative === 1 ? 0 : -1
    } else {
      offset = event.relative === 1 ? 1 : 0
    }

    const newIndex = this.hoverDataIndex + offset

    this.items.update(items => {
      items.splice(this.dragDataIndex, 1)
      items.splice(newIndex, 0, this.draggedItem!)
      return [...items]
    })

    this.dragDataIndex = newIndex
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

    Sortable.create(listElementWrapper, {
      animation: 150,
      autoScroll: false,
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
      onDrag: event => {
        this.onDragStart(event)
      },
      onMove: event => {
        this.onDragMove(event)
      },
      onDrop: event => {
        this.onDragEnd(event)
      },
      onChange: event => {
        this.onChange(event)
      },
      onAutoScroll: (event: any) => {
        console.log('scrolling', event)
      }
    })
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
        case 'separator':
          return 10
        default:
          return 0
      }
    })
  }

  /**
   * Scrolls the scrollable element when pressing the arrow keys
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    event.preventDefault()
    const scrollElement: HTMLElement = document.querySelector('.list-wrapper')!

    if (event.key === 'ArrowUp') {
      this.viewportElement().scrollTo({top: this.viewportElement().measureScrollOffset('top') - 100, behavior: 'smooth'})
    } else if (event.key === 'ArrowDown') {
      const scrollOffset = this.viewportElement().measureScrollOffset('top')
      scrollElement.scrollTo({top: scrollOffset + 100, behavior: 'smooth'})
    }
  }
}
