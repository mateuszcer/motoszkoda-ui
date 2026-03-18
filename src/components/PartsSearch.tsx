import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AssemblyGroup, CompatiblePart, PartOffer, WholesalerError } from '../domain/parts-types'
import { partsApi } from '../services/partsApi'
import { AssemblyGroupPicker } from './AssemblyGroupPicker'
import { PartsList } from './PartsList'

type Phase = 'idle' | 'loading-groups' | 'groups' | 'loading-parts' | 'parts' | 'error'

interface PartsSearchProps {
  vin: string
  onAddPart: (description: string, priceMinor?: number) => void
}

export function PartsSearch({ vin, onAddPart }: PartsSearchProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<Phase>('idle')
  const [groups, setGroups] = useState<AssemblyGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedGroupName, setSelectedGroupName] = useState('')
  const [compatibleParts, setCompatibleParts] = useState<CompatiblePart[]>([])
  const [offers, setOffers] = useState<PartOffer[]>([])
  const [failedSources, setFailedSources] = useState<WholesalerError[]>([])
  const [searching, setSearching] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const requestCounter = useRef(0)

  const loadGroups = useCallback(async () => {
    setPhase('loading-groups')
    setErrorMsg('')
    try {
      const res = await partsApi.getAssemblyGroups(vin)
      setGroups(res.groups)
      setPhase('groups')
    } catch {
      setErrorMsg(t('partsSearch.errorLoading'))
      setPhase('error')
    }
  }, [vin, t])

  const selectGroup = useCallback(
    async (groupId: number) => {
      setSelectedGroupId(groupId)
      const group = groups.find((g) => g.id === groupId)
      setSelectedGroupName(group?.name ?? '')
      setPhase('loading-parts')
      setOffers([])
      setFailedSources([])
      setCompatibleParts([])
      const reqId = ++requestCounter.current
      try {
        const res = await partsApi.getCompatibleParts(vin, groupId)
        if (reqId !== requestCounter.current) return
        setCompatibleParts(res.parts)
        setPhase('parts')
      } catch {
        if (reqId !== requestCounter.current) return
        setErrorMsg(t('partsSearch.errorLoading'))
        setPhase('error')
      }
    },
    [vin, groups, t],
  )

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query) {
        setOffers([])
        setFailedSources([])
        return
      }
      setSearching(true)
      const reqId = ++requestCounter.current
      try {
        const res = await partsApi.searchParts(vin, { q: query, groupId: selectedGroupId ?? undefined })
        if (reqId !== requestCounter.current) return
        setOffers(res.offers)
        setFailedSources(res.failedSources)
      } catch {
        if (reqId !== requestCounter.current) return
      } finally {
        if (reqId === requestCounter.current) {
          setSearching(false)
        }
      }
    },
    [vin, selectedGroupId],
  )

  const backToGroups = useCallback(() => {
    ++requestCounter.current
    setPhase('groups')
    setSelectedGroupId(null)
    setSelectedGroupName('')
    setCompatibleParts([])
    setOffers([])
    setFailedSources([])
    setSearching(false)
  }, [])

  if (phase === 'idle') {
    return (
      <div className="parts-search">
        <button type="button" className="parts-search-toggle" onClick={() => void loadGroups()}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {t('partsSearch.findParts')}
        </button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="parts-search">
        <div className="parts-search-panel">
          <p className="parts-error">{errorMsg}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void loadGroups()}>
            {t('partsSearch.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="parts-search">
      <div className="parts-search-panel">
        {phase === 'parts' || phase === 'loading-parts' ? (
          <div className="parts-breadcrumb">
            <button type="button" className="btn btn-ghost btn-sm" onClick={backToGroups}>
              {t('partsSearch.backToGroups')}
            </button>
            {selectedGroupName ? <span className="parts-breadcrumb-label">{selectedGroupName}</span> : null}
          </div>
        ) : null}

        {phase === 'loading-groups' || phase === 'groups' ? (
          <>
            <h4 className="parts-panel-title">{t('partsSearch.selectCategory')}</h4>
            <AssemblyGroupPicker
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelect={(id) => void selectGroup(id)}
              loading={phase === 'loading-groups'}
            />
          </>
        ) : null}

        {phase === 'loading-parts' ? <p className="parts-loading">{t('partsSearch.loadingParts')}</p> : null}

        {phase === 'parts' ? (
          <PartsList
            compatibleParts={compatibleParts}
            offers={offers}
            failedSources={failedSources}
            onAddPart={onAddPart}
            onSearch={handleSearch}
            searching={searching}
          />
        ) : null}
      </div>
    </div>
  )
}
