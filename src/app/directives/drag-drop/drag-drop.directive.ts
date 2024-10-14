import {
  ComponentRef,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  Type,
  ViewContainerRef
} from '@angular/core'
import Sortable, { MoveEvent, SortableEvent } from 'sortablejs'
import { ItemComponent } from '../../components/item/item.component'

@Directive({
  selector: '[dragDrop]',
  standalone: true
})
export class DragDropDirective<T extends { id: string } = any, C = any> implements OnInit {
  private elementRef = inject(ElementRef)
  private viewContainerRef = inject(ViewContainerRef)

  listElementSelector = input<string>()
  scrollElementSelector = input<string>()
  previewComponent = input<Type<C>>()
  dragData = input<T[]>()
  dragDataIndex = input<number>()

  onDragStart = output<SortableEvent>()
  onDragMove = output<MoveEvent>()
  onDragEnd = output<SortableEvent>()
  onPreviewCreate = output<ComponentRef<C>>()

  private items = contentChildren(ItemComponent, {read: ElementRef})

  private previewComponentRef: ComponentRef<C>

  constructor() {
    effect(() => {
      // this.setItemsData()
    })
  }

  ngOnInit(): void {
    this.initDragDrop()
  }

  /**
   * Sets the data for the items
   */
  private setItemsData(): void {
    this.items().forEach((item, index) => {
      item.nativeElement.dataset.index = index.toString()
    })
  }

  /**
   * Initializes the drag and drop functionality
   */
  private initDragDrop(): void {
    const listElementWrapper = this.listElementSelector() ? document.querySelector(this.listElementSelector()!) : undefined
    const scrollElement = this.scrollElementSelector() ? document.querySelector(this.scrollElementSelector()!) : undefined

    Sortable.create(listElementWrapper as HTMLElement || this.elementRef.nativeElement, {
      animation: 150,
      scroll: scrollElement as HTMLElement,
      scrollSpeed: 25,
      scrollSensitivity: 50,
      forceFallback: true,
      fallbackOnBody: true,
      ghostClass: 'sortable-ghost',
      swap: true,
      swapClass: 'sortable-swap',
      setData: (dataTransfer: DataTransfer, dragEl: HTMLElement) => {
        const data = this.dragData()![this.dragDataIndex()!]
        dataTransfer.setData('text/plain', data.id)
      },
      onStart: event => {
        this.onDragStart.emit(event)
        this.showDragPreview()
      },
      onMove: event => {
        this.onDragMove.emit(event)
      },
      onEnd: event => {
        this.onDragEnd.emit(event)
        this.removeDragPreview()
      }
    })
  }

  /**
   * Shows the drag preview component
   */
  private showDragPreview(): void {
    if (!this.previewComponent()) {
      return
    }

    this.previewComponentRef = this.viewContainerRef.createComponent(this.previewComponent()!)

    const ghost: HTMLElement = Sortable.ghost!
    ghost.innerHTML = ''
    ghost.appendChild(this.previewComponentRef.location.nativeElement)

    this.onPreviewCreate.emit(this.previewComponentRef)
  }

  /**
   * Destroys the drag preview component
   */
  private removeDragPreview(): void {
    if (this.previewComponentRef) {
      this.previewComponentRef.destroy()
    }
  }
}
