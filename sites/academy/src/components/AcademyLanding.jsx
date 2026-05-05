/**
 * <AcademyLanding />
 *
 * Client-side composer for the academy landing. Reads the active
 * content-type filter from the `?type=` query string, renders the
 * <ContentTypeFilter /> chip row, and shows a filtered
 * <ContentCardGrid /> below.
 *
 * Used by sites/academy/src/pages/index.mdx in batch 2 with hardcoded
 * sample items. Batch 3 swaps the items prop for posts pulled from the
 * Docusaurus blog plugin (`useGlobalData()` or generated module data).
 */

import React, {useEffect, useMemo, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  ContentCardGrid,
  ContentCard,
  ContentTypeFilter,
  CONTENT_TYPES,
} from '@conduction/docusaurus-preset/components';

const TYPE_SET = new Set(CONTENT_TYPES);

function readTypeFromSearch(search) {
  try {
    const params = new URLSearchParams(search);
    const t = params.get('type');
    return t && TYPE_SET.has(t) ? t : null;
  } catch (_) {
    return null;
  }
}

function countsByType(items) {
  const c = {};
  for (const it of items) {
    if (!it.contentType) continue;
    c[it.contentType] = (c[it.contentType] || 0) + 1;
  }
  return c;
}

function FilterAndGrid({items, columns = 2}) {
  const [activeType, setActiveType] = useState(() =>
    readTypeFromSearch(typeof window !== 'undefined' ? window.location.search : '')
  );

  useEffect(() => {
    const onPop = () => setActiveType(readTypeFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const counts = useMemo(() => countsByType(items), [items]);
  const allCount = items.length;

  const filtered = activeType
    ? items.filter((it) => it.contentType === activeType)
    : items;

  const handleChange = (next) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('type', next);
    else url.searchParams.delete('type');
    window.history.pushState({}, '', url.toString());
    setActiveType(next);
  };

  return (
    <>
      <ContentTypeFilter
        value={activeType}
        onChange={handleChange}
        counts={counts}
        allCount={allCount}
      />

      <div style={{height: 32}} />

      <ContentCardGrid columns={columns}>
        {filtered.map((it, i) => (
          <ContentCard key={it.href || i} {...it} />
        ))}
      </ContentCardGrid>
    </>
  );
}

export default function AcademyLanding({items, columns = 2}) {
  return (
    <BrowserOnly fallback={
      <ContentCardGrid columns={columns}>
        {items.map((it, i) => <ContentCard key={it.href || i} {...it} />)}
      </ContentCardGrid>
    }>
      {() => <FilterAndGrid items={items} columns={columns} />}
    </BrowserOnly>
  );
}
