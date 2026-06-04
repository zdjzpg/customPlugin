import { createCategoryIconMarkup } from './categoryIconMarkup.mjs';

export function createCategoryOverviewMarkup(categories) {
  return `
    <div class="category-grid">
      ${categories
        .map(
          (category) => `
            <article class="category-card">
              <div class="category-card-icon" aria-hidden="true">${createCategoryIconMarkup(category.key)}</div>
              <div class="category-card-copy">
                <h3>${category.label}</h3>
                <p>${category.description || ''}</p>
              </div>
              <button class="button category-card-button" type="button" data-open-category="${category.key}">
                进入分类
              </button>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}
