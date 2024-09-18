import { ChangeDetectionStrategy, Component, OnInit, signal, viewChild } from '@angular/core'
import { Item } from '../../models/item.model'
import { mockItems } from '../../models/item.mock'
import { ItemComponent } from '../item/item.component'
import Sortable from 'sortablejs'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [ItemComponent
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements OnInit {
  items: Item[] = []


  ngOnInit(): void {
    this.mockData()
    this.initDD()
  }

  private mockData(): void {
    this.items = mockItems(1000)
  }

  private initDD(): void {
    const listElement = document.getElementById('list')!

    Sortable.create(listElement, {
      group: 'shared',
      animation: 150,
      onEnd: (event) => {
        const item = this.items[event.oldIndex!]
        this.items.splice(event.oldIndex!, 1)
        this.items.splice(event.newIndex!, 0, item)
      },
      scroll: document.documentElement,
      scrollSpeed: 400,
      scrollSensitivity: 100
    })
  }

  /**
   * Updates the item in the list
   * @param updatedItem
   */
  onItemChanged(updatedItem: Item): void {
    this.items = this.items.map(i => (i.id === updatedItem.id ? updatedItem : i))
  }
}
