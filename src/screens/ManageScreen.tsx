import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useManageGame } from '../hooks/use-manage-game'
import { SearchBox } from '../components/SearchBox'
import { TechList } from '../components/TechList'
import { ActionCardList } from '../components/ActionCardList'
import { PromissoryNoteList } from '../components/PromissoryNoteList'
import { RelicList } from '../components/RelicList'
import { LeaderList } from '../components/LeaderList'
import styles from './ManageScreen.module.css'

const TABS = ['Techs', 'Action Cards', 'Promissory', 'Relics', 'Leaders'] as const
type Tab = (typeof TABS)[number]

export function ManageScreen() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const {
    game, faction, techs, actionCards, promissoryNotes, relics, loading,
    toggleTech, adjustActionCard, togglePromissoryNote, toggleRelic, toggleLeader,
  } = useManageGame(gameId)

  const [activeTab, setActiveTab] = useState<Tab>('Techs')
  const [search, setSearch] = useState('')

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!game) return <div className={styles.loading}>Game not found</div>

  const query = search.toLowerCase()

  function filterByName<T extends { name: string }>(items: T[]): T[] {
    if (!query) return items
    return items.filter(item => item.name.toLowerCase().includes(query))
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(`/game/${gameId}`)}>
          Back
        </button>
        <h1 className={styles.title}>Manage</h1>
      </header>

      <SearchBox value={search} onChange={setSearch} />

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'Techs' && (
          <TechList
            techs={filterByName(techs)}
            ownedTechIds={game.ownedTechIds}
            onToggle={toggleTech}
          />
        )}
        {activeTab === 'Action Cards' && (
          <ActionCardList
            cards={filterByName(actionCards)}
            ownedCards={game.ownedActionCards}
            onAdjust={adjustActionCard}
          />
        )}
        {activeTab === 'Promissory' && (
          <PromissoryNoteList
            notes={filterByName(promissoryNotes)}
            ownedNoteIds={game.ownedPromissoryNoteIds}
            onToggle={togglePromissoryNote}
          />
        )}
        {activeTab === 'Relics' && (
          <RelicList
            relics={filterByName(relics)}
            ownedRelicIds={game.ownedRelicIds}
            onToggle={toggleRelic}
          />
        )}
        {activeTab === 'Leaders' && faction && (
          <LeaderList
            leaders={faction.leaders.filter(l => !query || l.name.toLowerCase().includes(query))}
            leaderStates={game.leaderStates}
            onToggle={toggleLeader}
          />
        )}
      </div>
    </div>
  )
}
