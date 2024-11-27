import { rand, randCatchPhrase, randLine, randNumber, randUuid } from '@ngneat/falso'
import { Item } from './item.model'

/**
 * Mocks an item object
 * @param {string} type
 * @returns Item
 */
export function mockItem(type: 'header' | 'item' | 'separator'): Item {
  return {
    id: randUuid(),
    title: randCatchPhrase(),
    description: randLine({ lineCount: randNumber({ min: 5, max: 20 })}),
    expanded: false,
    type
  }
}

/**
 * Mocks a list of items.
 * It starts with a item type header following by a random number of items type item
 * @param {number} count
 * @returns Item[]
 */
export function mockItems(count = 10000): Item[] {
  const items: Item[] = []
  let remaining = count

  while (remaining > 0) {
    // Add a separator
    items.push(mockItem('separator'))
    remaining--

    // Add a header
    items.push(mockItem('header'))
    remaining--

    if (remaining) {
      // Add a random number of items
      const itemCount = randNumber({min: 0, max: Math.min(remaining, 10)})
      for (let i = 0; i < itemCount; i++) {
        items.push(mockItem('item'))
        remaining--
      }
    }

    // Add a separator
    items.push(mockItem('separator'))
    remaining--

    if (remaining < 3) {
      break
    }
  }

  return items
}
