import type { Technology } from '../types'
import { SectionHeading } from './SectionHeading'
import styles from './TechList.module.css'

interface TechListProps {
  techs: Technology[]
  ownedTechIds: string[]
  onToggle: (techId: string) => void
}

const COLOR_ORDER = ['blue', 'green', 'red', 'yellow'] as const

export function TechList({ techs, ownedTechIds, onToggle }: TechListProps) {
  const ownedSet = new Set(ownedTechIds)

  const colorGroups = COLOR_ORDER.map(color => ({
    label: color.charAt(0).toUpperCase() + color.slice(1),
    techs: techs
      .filter(t => t.type === 'color' && t.color === color)
      .sort((a, b) => a.prerequisites.length - b.prerequisites.length),
  })).filter(g => g.techs.length > 0)

  const unitUpgrades = techs
    .filter(t => t.type === 'unit-upgrade')
    .sort((a, b) => a.prerequisites.length - b.prerequisites.length)

  const groups = [
    ...colorGroups,
    ...(unitUpgrades.length > 0
      ? [{ label: 'Unit Upgrades', techs: unitUpgrades }]
      : []),
  ]

  return (
    <div>
      {groups.map(group => (
        <section key={group.label} className={styles.section}>
          <SectionHeading as="h3">{group.label}</SectionHeading>
          <div className={styles.techGrid}>
            {group.techs.map(tech => (
              <button
                key={tech.id}
                className={`${styles.techBtn} ${ownedSet.has(tech.id) ? styles.owned : ''}`}
                onClick={() => onToggle(tech.id)}
              >
                {tech.name}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
