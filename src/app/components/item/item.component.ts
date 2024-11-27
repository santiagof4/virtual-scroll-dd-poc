import { ChangeDetectionStrategy, Component, HostBinding, input, model } from '@angular/core'
import { Item } from '../../models/item.model'

@Component({
    selector: 'app-item',
    imports: [],
    templateUrl: './item.component.html',
    styleUrl: './item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent {
  item = model.required<Item>()
  nextItem = input<Item>()

  @HostBinding('class')
  get typeClass() {
    return this.item().type
  }

  @HostBinding('class.expanded')
  get expandedClass() {
    return this.item().expanded
  }

  @HostBinding('class.separator-top')
  get separatorTopClass(): boolean {
    return this.item().type === 'separator' && this.nextItem()?.type === 'header'
  }

  @HostBinding('class.separator-bottom')
  get separatorBottomClass(): boolean {
    return this.item().type === 'separator' && (this.nextItem()?.type === 'separator' || !this.nextItem())
  }

  @HostBinding('class.last-of-group')
  get lastOfGroupClass(): boolean {
    return this.nextItem()?.type === 'separator'
  }

  /**
   * Toggles the expanded state of the item
   */
  toggleExpand() {
    this.item.update(item => ({...item, expanded: !item.expanded}))
  }
}
