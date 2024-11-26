import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core'
import { Item } from '../../models/item.model'

@Component({
    selector: 'app-item-drag-preview',
    imports: [],
    templateUrl: './item-drag-preview.component.html',
    styleUrl: './item-drag-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDragPreviewComponent {
  item = input<Item>()
  dropItem = input<Item>()
  dropEdge = input<string>()
  isIndented = input<boolean>()

  @HostBinding('class')
  get typeClass() {
    return this.item().type
  }
}
