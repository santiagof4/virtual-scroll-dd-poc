export type ItemType = 'header' | 'item' | 'separator' | 'space'

export interface Item {
  id: string
  title: string
  description: string
  expanded: boolean
  type: ItemType
  headerId?: string
}

export const ITEM_SIZE = 34
export const HEADER_SIZE = 70
export const SEPARATOR_SIZE = 30
export const SPACE_SIZE = 34

export function isEmptyGroup(items: Item[], item: Item): boolean {
  return items.find(i => i.headerId === item.id && i.type === 'item') === undefined
}
