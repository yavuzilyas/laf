export interface CategoryNode {
  id: string;
  translationKey: string;
  children?: CategoryNode[];
}

export const categoryTree: CategoryNode[] = [
  {
    id: 'economics',
    translationKey: 'economics'
  },
  {
    id: 'politics',
    translationKey: 'politics'
  },
  {
    id: 'internationalRelations',
    translationKey: 'internationalRelations'
  },
  {
    id: 'sociology',
    translationKey: 'sociology'
  },
  {
    id: 'history',
    translationKey: 'history'
  },
  {
    id: 'law',
    translationKey: 'law'
  }
];
