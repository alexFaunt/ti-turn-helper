import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useManageGame } from '../hooks/use-manage-game'
import { SearchBox } from '../components/SearchBox'
import { SectionHeading } from '../components/SectionHeading'
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
  const searching = query.length > 0

  function filterByName<T extends { name: string }>(items: T[]): T[] {
    if (!query) return items
    return items.filter(item => item.name.toLowerCase().includes(query))
  }

  // While searching, ignore the active tab and surface matches across every category at once.
  const matches = {
    techs: filterByName(techs),
    actionCards: filterByName(actionCards),
    promissoryNotes: filterByName(promissoryNotes),
    relics: filterByName(relics),
    leaders: filterByName(faction?.leaders ?? []),
  }
  const totalMatches =
    matches.techs.length + matches.actionCards.length + matches.promissoryNotes.length +
    matches.relics.length + matches.leaders.length

  const matchCount: Record<Tab, number> = {
    Techs: matches.techs.length,
    'Action Cards': matches.actionCards.length,
    Promissory: matches.promissoryNotes.length,
    Relics: matches.relics.length,
    Leaders: matches.leaders.length,
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/game/${gameId}`)}
          aria-label="Back"
        >
          ‹
        </button>
        <h1 className={styles.title}>Manage</h1>
      </header>

      <div className={styles.tabs}>
        {TABS.map(tab => {
          // While searching, tabs become match indicators: categories with hits get a soft
          // (dimmer) highlight, empties dim to a disabled look. Otherwise normal tab selection.
          const tabClass = searching
            ? matchCount[tab] > 0 ? styles.tabMatch : styles.tabDimmed
            : activeTab === tab ? styles.tabActive : ''
          return (
            <button
              key={tab}
              className={`${styles.tab} ${tabClass}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <SearchBox value={search} onChange={setSearch} />

      <div className={styles.content}>
        {searching ? (
          totalMatches === 0 ? (
            <p className={styles.noResults}>No matches for "{search}"</p>
          ) : (
            <>
              {matches.techs.length > 0 && (
                <section className={styles.resultGroup}>
                  <TechList
                    techs={matches.techs}
                    ownedTechIds={game.ownedTechIds}
                    onToggle={toggleTech}
                    groupLabelPrefix="Techs"
                  />
                </section>
              )}
              {matches.actionCards.length > 0 && (
                <section className={styles.resultGroup}>
                  <SectionHeading as="h2">Action Cards</SectionHeading>
                  <ActionCardList
                    cards={matches.actionCards}
                    ownedCards={game.ownedActionCards}
                    onAdjust={adjustActionCard}
                  />
                </section>
              )}
              {matches.promissoryNotes.length > 0 && (
                <section className={styles.resultGroup}>
                  <SectionHeading as="h2">Promissory</SectionHeading>
                  <PromissoryNoteList
                    notes={matches.promissoryNotes}
                    ownedNoteIds={game.ownedPromissoryNoteIds}
                    onToggle={togglePromissoryNote}
                  />
                </section>
              )}
              {matches.relics.length > 0 && (
                <section className={styles.resultGroup}>
                  <SectionHeading as="h2">Relics</SectionHeading>
                  <RelicList
                    relics={matches.relics}
                    ownedRelicIds={game.ownedRelicIds}
                    onToggle={toggleRelic}
                  />
                </section>
              )}
              {matches.leaders.length > 0 && (
                <section className={styles.resultGroup}>
                  <SectionHeading as="h2">Leaders</SectionHeading>
                  <LeaderList
                    leaders={matches.leaders}
                    leaderStates={game.leaderStates}
                    onToggle={toggleLeader}
                  />
                </section>
              )}
            </>
          )
        ) : (
          <>
            {activeTab === 'Techs' && (
              <TechList
                techs={techs}
                ownedTechIds={game.ownedTechIds}
                onToggle={toggleTech}
              />
            )}
            {activeTab === 'Action Cards' && (
              <ActionCardList
                cards={actionCards}
                ownedCards={game.ownedActionCards}
                onAdjust={adjustActionCard}
              />
            )}
            {activeTab === 'Promissory' && (
              <PromissoryNoteList
                notes={promissoryNotes}
                ownedNoteIds={game.ownedPromissoryNoteIds}
                onToggle={togglePromissoryNote}
              />
            )}
            {activeTab === 'Relics' && (
              <RelicList
                relics={relics}
                ownedRelicIds={game.ownedRelicIds}
                onToggle={toggleRelic}
              />
            )}
            {activeTab === 'Leaders' && faction && (
              <LeaderList
                leaders={faction.leaders}
                leaderStates={game.leaderStates}
                onToggle={toggleLeader}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
