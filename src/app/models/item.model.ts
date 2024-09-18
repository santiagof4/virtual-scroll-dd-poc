export interface Item {
  id: string
  title: string
  description: string
  expanded: boolean
  type: 'header' | 'item'
}
