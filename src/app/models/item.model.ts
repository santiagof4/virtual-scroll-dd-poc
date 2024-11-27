export interface Item {
  id: string
  title: string
  description: string
  expanded: boolean
  type: 'header' | 'item' | 'separator'
}

export const ITEM_SIZE = 34
export const HEADER_SIZE = 100
