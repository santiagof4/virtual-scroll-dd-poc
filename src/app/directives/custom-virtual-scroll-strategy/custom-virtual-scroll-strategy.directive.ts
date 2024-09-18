import { VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling'
import { ChangeDetectorRef, Directive, ElementRef, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CustomVirtualScrollStrategyDirective } from './custom-virtual-scroll-strategy'

type ItemHeight = number[]

function factory(dir: CustomVirtualScrollDirective) {
  return dir.scrollStrategy
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'cdk-virtual-scroll-viewport[customVirtualScrollStrategy]',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: factory,
      deps: [forwardRef(() => CustomVirtualScrollDirective)]
    }
  ],
  standalone: true
})
export class CustomVirtualScrollDirective implements OnChanges {
  @Input() itemHeights: ItemHeight = []

  scrollStrategy: CustomVirtualScrollStrategyDirective = new CustomVirtualScrollStrategyDirective(this.itemHeights)

  constructor(
    private elRef: ElementRef,
    private cd: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if ('itemHeights' in changes) {
      this.scrollStrategy.updateItemHeights(this.itemHeights)
      this.cd.detectChanges()
    }
  }
}
