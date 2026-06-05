import { SKILL_POOL, SkillCard } from '../data/skills'

const RARITY_WEIGHTS = {
  common: 55,
  rare: 30,
  epic: 12,
  legendary: 3,
}

function weightedRandom(cards: SkillCard[]): SkillCard {
  const total = cards.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0)
  let r = Math.random() * total
  for (const card of cards) {
    r -= RARITY_WEIGHTS[card.rarity]
    if (r <= 0) return card
  }
  return cards[cards.length - 1]
}

export function drawSkillCards(count: number = 3, excludeIds: string[] = []): SkillCard[] {
  const available = SKILL_POOL.filter(c => !excludeIds.includes(c.id))
  if (available.length <= count) return available

  const drawn: SkillCard[] = []
  const used = new Set<string>()

  while (drawn.length < count && used.size < available.length) {
    const card = weightedRandom(available.filter(c => !used.has(c.id)))
    if (!used.has(card.id)) {
      drawn.push(card)
      used.add(card.id)
    }
  }
  return drawn
}

export function getRarityColor(rarity: SkillCard['rarity']): string {
  switch (rarity) {
    case 'common':   return '#9e9e9e'
    case 'rare':     return '#2196f3'
    case 'epic':     return '#9c27b0'
    case 'legendary': return '#ff9800'
  }
}

export function getRarityGlow(rarity: SkillCard['rarity']): string {
  switch (rarity) {
    case 'common':   return 'rgba(158,158,158,0.4)'
    case 'rare':     return 'rgba(33,150,243,0.5)'
    case 'epic':     return 'rgba(156,39,176,0.5)'
    case 'legendary': return 'rgba(255,152,0,0.7)'
  }
}
