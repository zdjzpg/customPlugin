export function createAdminUsageChartMarkup(chart) {
  const days = Array.isArray(chart?.days) ? chart.days : [];
  const series = Array.isArray(chart?.series) ? chart.series : [];

  if (!days.length || !series.length) {
    return `
      <div class="admin-chart-empty" data-admin-usage-chart>
        输入卡密并查询后，这里会显示该卡密按天统计的前 15 个工具点击量图表。
      </div>
    `;
  }

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.countsByDay || []).map((value) => Number(value) || 0)
  );
  const width = 920;
  const height = 320;
  const left = 56;
  const right = 24;
  const top = 18;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const dayStep = days.length > 1 ? plotWidth / (days.length - 1) : 0;
  const palette = ['#2d64df', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#0ea5e9', '#65a30d', '#dc2626', '#7c3aed'];

  const paths = series
    .map((item, index) => {
      const color = palette[index % palette.length];
      const points = item.countsByDay.map((value, pointIndex) => {
        const x = left + dayStep * pointIndex;
        const y = top + plotHeight - ((Number(value) || 0) / maxValue) * plotHeight;
        return `${x},${y}`;
      });

      return `<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${points.join(' ')}" />`;
    })
    .join('');

  const xLabels = days
    .map((day, index) => {
      const x = left + dayStep * index;
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" class="admin-chart-axis-label">${escapeHtml(day)}</text>`;
    })
    .join('');

  const yGuides = Array.from({ length: 5 }, (_item, index) => {
    const value = Math.round((maxValue / 4) * (4 - index));
    const y = top + (plotHeight / 4) * index;
    return `
      <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="admin-chart-grid-line" />
      <text x="${left - 10}" y="${y + 4}" text-anchor="end" class="admin-chart-axis-label">${value}</text>
    `;
  }).join('');

  const legend = series
    .map((item, index) => {
      const color = palette[index % palette.length];
      return `
        <div class="admin-chart-legend-item">
          <span class="admin-chart-legend-dot" style="background:${color}"></span>
          <span>${escapeHtml(item.label)}</span>
          <span class="admin-chart-legend-count">总点击 ${escapeHtml(item.totalCount)}</span>
        </div>
      `;
    })
    .join('');

  const tableRows = days
    .map((day, dayIndex) => `
      <tr>
        <td>${escapeHtml(day)}</td>
        ${series.map((item) => `<td>${escapeHtml(item.countsByDay?.[dayIndex] || 0)}</td>`).join('')}
      </tr>
    `)
    .join('');

  return `
    <div class="admin-usage-chart-shell" data-admin-usage-chart>
      <div class="admin-chart-legend">${legend}</div>
      <svg viewBox="0 0 ${width} ${height}" class="admin-usage-chart-svg" aria-label="按天点击量图表">
        ${yGuides}
        <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" class="admin-chart-axis-line" />
        <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" class="admin-chart-axis-line" />
        ${paths}
        ${xLabels}
      </svg>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              ${series.map((item) => `<th>${escapeHtml(item.label)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
