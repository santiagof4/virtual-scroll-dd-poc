import { randCatchPhrase, randLine, randNumber, randUuid } from '@ngneat/falso'
import { Item, ItemType } from './item.model'

/**
 * Mocks an item object
 * @param {ItemType} type
 * @param {string} headerId
 * @returns Item
 */
export function mockItem(type: ItemType, headerId?: string): Item {
  return {
    id: randUuid(),
    title: type === 'space' ? 'No items in group' : randCatchPhrase(),
    description: randLine({ lineCount: randNumber({ min: 5, max: 20 })}),
    expanded: false,
    type,
    headerId
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
    const header = mockItem('header')
    items.push(header)
    remaining--

    if (remaining) {
      // Add a random number of items
      const itemCount = randNumber({min: 0, max: Math.min(remaining, 10)})

      if (itemCount === 0) {
        items.push(mockItem('space',  header.id))
      } else {
        for (let i = 0; i < itemCount; i++) {
          items.push(mockItem('item', header.id))
          remaining--
        }
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
