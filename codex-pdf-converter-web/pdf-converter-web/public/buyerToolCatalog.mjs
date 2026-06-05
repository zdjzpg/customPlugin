import { devToolCatalog, getDevToolByKey } from './devToolCatalog.mjs';
import { getLocalImageToolByKey, localImageToolCatalog } from './localImageToolCatalog.mjs';
import { getMediaToolByKey, mediaToolCatalog } from './mediaToolCatalog.mjs';
import { getTextToolByKey, textToolCatalog } from './textToolCatalog.mjs';

export function getToolsForCategory(conversionCatalog, categoryKey) {
  if (categoryKey === 'ppt_tools') {
    return conversionCatalog.filter((item) => (item.categoryKey || 'ppt_tools') === 'ppt_tools');
  }

  if (categoryKey === 'text_tools') {
    return [
      ...conversionCatalog.filter((item) => item.categoryKey === 'text_tools'),
      ...textToolCatalog
    ];
  }

  if (categoryKey === 'dev_tools') {
    return devToolCatalog;
  }

  if (categoryKey === 'media_tools') {
    return mediaToolCatalog;
  }

  if (categoryKey === 'image_tools') {
    return [
      ...conversionCatalog.filter((item) => item.categoryKey === 'image_tools'),
      ...localImageToolCatalog
    ];
  }

  return [];
}

export function getVisibleTools(conversionCatalog, categoryKey, searchKeyword = '') {
  const keyword = String(searchKeyword || '').trim().toLowerCase();
  const tools = keyword ? getAllBuyerTools(conversionCatalog) : getToolsForCategory(conversionCatalog, categoryKey);
  if (!keyword) {
    return tools;
  }

  return tools.filter((item) =>
    item.label.toLowerCase().includes(keyword) ||
    (item.helperText || '').toLowerCase().includes(keyword)
  );
}

export function getAllBuyerTools(conversionCatalog) {
  return [
    ...conversionCatalog.map((item) => ({ ...item, categoryKey: item.categoryKey || 'ppt_tools' })),
    ...textToolCatalog,
    ...devToolCatalog,
    ...mediaToolCatalog,
    ...localImageToolCatalog
  ];
}

export function getBuyerToolByKey(conversionCatalog, toolKey) {
  return conversionCatalog.find((entry) => entry.key === toolKey) ||
    getTextToolByKey(toolKey) ||
    getDevToolByKey(toolKey) ||
    getMediaToolByKey(toolKey) ||
    getLocalImageToolByKey(toolKey);
}
