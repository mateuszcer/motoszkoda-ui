import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AssemblyGroup } from '../domain/parts-types'

interface AssemblyGroupPickerProps {
  groups: AssemblyGroup[]
  selectedGroupId: number | null
  onSelect: (groupId: number) => void
  loading: boolean
}

export function AssemblyGroupPicker({ groups, selectedGroupId, onSelect, loading }: AssemblyGroupPickerProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')

  const tree = useMemo(() => {
    const parents: AssemblyGroup[] = []
    const childrenMap = new Map<number, AssemblyGroup[]>()

    for (const g of groups) {
      if (g.parentId == null) {
        parents.push(g)
      } else {
        const list = childrenMap.get(g.parentId) ?? []
        list.push(g)
        childrenMap.set(g.parentId, list)
      }
    }

    return { parents, childrenMap }
  }, [groups])

  const filteredTree = useMemo(() => {
    if (!filter.trim()) return tree

    const q = filter.toLowerCase()
    const matchedParentIds = new Set<number>()
    const filteredChildrenMap = new Map<number, AssemblyGroup[]>()

    for (const [parentId, children] of tree.childrenMap) {
      const matched = children.filter((c) => c.name.toLowerCase().includes(q))
      if (matched.length > 0) {
        matchedParentIds.add(parentId)
        filteredChildrenMap.set(parentId, matched)
      }
    }

    const filteredParents = tree.parents.filter((p) => p.name.toLowerCase().includes(q) || matchedParentIds.has(p.id))

    return { parents: filteredParents, childrenMap: filteredChildrenMap }
  }, [tree, filter])

  if (loading) {
    return <p className="parts-loading">{t('partsSearch.loadingGroups')}</p>
  }

  return (
    <div className="parts-group-picker">
      <label className="parts-group-filter">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('partsSearch.filterGroups')}
        />
      </label>

      {filteredTree.parents.length === 0 ? <p className="parts-no-results">{t('partsSearch.noResults')}</p> : null}

      {filteredTree.parents.map((parent) => {
        const children = filteredTree.childrenMap.get(parent.id)
        return (
          <div className="parts-group-section" key={parent.id}>
            <h4 className="parts-group-heading">{parent.name}</h4>
            <div className="parts-group-chips">
              {children
                ? children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className={`chip ${selectedGroupId === child.id ? 'chip-active' : ''}`}
                      onClick={() => onSelect(child.id)}
                    >
                      {child.name}
                    </button>
                  ))
                : null}
              {!children ? (
                <button
                  type="button"
                  className={`chip ${selectedGroupId === parent.id ? 'chip-active' : ''}`}
                  onClick={() => onSelect(parent.id)}
                >
                  {parent.name}
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
