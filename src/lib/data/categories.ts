export interface CategoryNode {
  id: string;
  translationKey: string;
  children?: CategoryNode[];
}

export const categoryTree: CategoryNode[] = [
  {
    id: 'philosophy',
    translationKey: 'philosophy',
    children: [
      { id: 'ethics', translationKey: 'ethics' },
      { id: 'epistemology', translationKey: 'epistemology' },
      { id: 'theology', translationKey: 'theology' }
    ]
  },
  {
    id: 'economics',
    translationKey: 'economics',
    children: [
      { id: 'leftSocialistEconomics', translationKey: 'leftSocialistEconomics' },
      { id: 'mercantilistEconomics', translationKey: 'mercantilistEconomics' },
      { id: 'positiveEconomicTheories', translationKey: 'positiveEconomicTheories' },
      { id: 'liberalEconomics', translationKey: 'liberalEconomics' },
      { id: 'austrianSolution', translationKey: 'austrianSolution' },
      { id: 'contemporaryEconomicDynamics', translationKey: 'contemporaryEconomicDynamics' }
    ]
  },
  {
    id: 'stateTheory',
    translationKey: 'stateTheory'
  },
  {
    id: 'naturalLaw',
    translationKey: 'naturalLaw',
    children: [
      { id: 'polilegalismPositiveLaw', translationKey: 'polilegalismPositiveLaw' },
      { id: 'stateLaw', translationKey: 'stateLaw' },
      { id: 'legalFoundationsOfLibertarianSociety', translationKey: 'legalFoundationsOfLibertarianSociety' },
      { id: 'contemporaryLaw', translationKey: 'contemporaryLaw' }
    ]
  },
  {
    id: 'revisionistHistory',
    translationKey: 'revisionistHistory',
    children: [
      { id: 'officialHistory', translationKey: 'officialHistory' },
      { id: 'alternativeAcademicHistoricalTheses', translationKey: 'alternativeAcademicHistoricalTheses' },
      { id: 'whigHistory', translationKey: 'whigHistory' },
      { id: 'legendaryHistory', translationKey: 'legendaryHistory' },
      { id: 'historicism', translationKey: 'historicism' },
      { id: 'antiStateHistory', translationKey: 'antiStateHistory' },
      { id: 'historyAsClassStruggle', translationKey: 'historyAsClassStruggle' },
      { id: 'thymologyHistory', translationKey: 'thymologyHistory' },
      { id: 'religiousHistory', translationKey: 'religiousHistory' },
      { id: 'languageHistory', translationKey: 'languageHistory' },
      { id: 'anthropology', translationKey: 'anthropology' }
    ]
  },
  {
    id: 'revisionistScience',
    translationKey: 'revisionistScience'
  },
  {
    id: 'praxeology',
    translationKey: 'praxeology',
    children: [
      { id: 'gameTheory', translationKey: 'gameTheory' },
      { id: 'catallaxyCrusoeEconomics', translationKey: 'catallaxyCrusoeEconomics' },
      { id: 'warTheory', translationKey: 'warTheory' },
      { id: 'praxeologicalEthics', translationKey: 'praxeologicalEthics' },
      { id: 'law', translationKey: 'law' },
      { id: 'antipoliticsStateTheory', translationKey: 'antipoliticsStateTheory' }
    ]
  },
  {
    id: 'thymology',
    translationKey: 'thymology',
    children: [
      { id: 'history', translationKey: 'history' },
      { id: 'anthropologyEthnology', translationKey: 'anthropologyEthnology' },
      { id: 'linguistics', translationKey: 'linguistics' },
      { id: 'psychology', translationKey: 'psychology' },
      { id: 'sociology', translationKey: 'sociology' }
    ]
  }
];
