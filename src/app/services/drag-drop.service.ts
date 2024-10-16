import { ComponentRef, Injectable, signal, ViewContainerRef } from '@angular/core'

@Injectable()
export class DragDropService<I extends { id: string }> {
  isDragging = signal(false)
  dragMoved = signal(false)
  draggingOverItem = signal<I | undefined>(undefined)
  dragData = signal<I | undefined>(undefined)

  viewContainerRef: ViewContainerRef
  previewComponentRef: ComponentRef<any>
  previewOffset: { x: number; y: number }
}
