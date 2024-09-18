import { rand, randCatchPhrase, randLine, randNumber, randUuid } from '@ngneat/falso'
import { Item } from './item.model'

/**
 * Mocks an item object
 * @returns Item
 */
export function mockItem(type: 'header' | 'item'): Item {
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
    // Add a header
    items.push(mockItem('header'))
    remaining--

    // Add a random number of items
    const itemCount = randNumber({ min: 0, max: Math.min(remaining, 10) })
    for (let i = 0; i < itemCount; i++) {
      items.push(mockItem('item'))
      remaining--
    }
  }

  return items
}
