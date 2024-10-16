import { ChangeDetectionStrategy, Component, HostBinding, model } from '@angular/core'
import { Item } from '../../models/item.model'

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent {
  item = model.required<Item>()

  @HostBinding('class')
  get typeClass() {
    return this.item().type
  }

  @HostBinding('class.expanded')
  get expandedClass() {
    return this.item().expanded
  }

  /**
   * Toggles the expanded state of the item
   */
  toggleExpand() {
    this.item.update(item => ({...item, expanded: !item.expanded}))
  }
}
