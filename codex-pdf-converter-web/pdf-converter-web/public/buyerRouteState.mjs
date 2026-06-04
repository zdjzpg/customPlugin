const DEFAULT_CATEGORY_KEY = 'ppt_tools';

export function parseBuyerRouteState(hashText) {
  const raw = String(hashText || '').replace(/^#/, '').trim();
  const params = new URLSearchParams(raw);
  const view = params.get('view') === 'detail' ? 'detail' : 'tool_list';
  const categoryKey = params.get('category') || DEFAULT_CATEGORY_KEY;
  const conversionKey = params.get('tool') || null;
  const searchKeyword = params.get('search') || '';

  return {
    view,
    categoryKey,
    conversionKey,
    searchKeyword
  };
}

export function stringifyBuyerRouteState(state) {
  const params = new URLSearchParams();
  params.set('view', state?.view === 'detail' ? 'detail' : 'tool_list');
  params.set('category', state?.categoryKey || DEFAULT_CATEGORY_KEY);

  if (state?.view === 'detail' && state?.conversionKey) {
    params.set('tool', state.conversionKey);
  }

  if (state?.searchKeyword) {
    params.set('search', state.searchKeyword);
  }

  return `#${params.toString()}`;
}
