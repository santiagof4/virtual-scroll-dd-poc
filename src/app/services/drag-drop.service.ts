import { Injectable, signal } from '@angular/core'
import { Item } from '../models/item.model'

@Injectable({
  providedIn: 'root'
})
export class DragDropService {

  items = signal<Item[]>([])
  isDragging = signal(false)
  dragMoved = signal(false)
  draggingOverItem = signal<Item | undefined>(undefined)
  dragData = signal<Item | undefined>(undefined)
}
