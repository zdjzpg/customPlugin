<template>
  <div :class="['student-craft-report', `student-craft-report--${layoutMode}`]">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">{{ labels.title }}</h1>
          <p class="hero-subtitle">
            {{ labels.profile }}{{ student.name || '-' }}{{ labels.separator }}
            {{ labels.age }}{{ student.age || '-' }}{{ labels.separator }}
            {{ labels.school }}{{ student.school || '-' }}{{ labels.separator }}
            {{ labels.contact }}{{ student.phone || '-' }}
          </p>
        </div>
        <div v-if="showActions" class="hero-actions">
          <button class="btn btn-secondary" @click="$emit('download-image')">{{ labels.exportImage }}</button>
          <button class="btn btn-primary" @click="$emit('download-html')">{{ labels.downloadHtml }}</button>
        </div>
      </div>
      <div class="chip-row craft-sticker-row">
        <div class="chip craft-sticker">{{ labels.sticker }}</div>
        <div class="chip craft-sticker">{{ totalChipText }}</div>
        <div class="chip craft-sticker">{{ percentChipText }}</div>
        <div v-if="rewardName" class="chip craft-sticker">{{ rewardChipText }}</div>
      </div>
    </div>

    <div class="report-grid report-craft-shell">
      <div class="summary-kpis craft-kpi-grid">
        <div class="kpi craft-kpi craft-kpi-score">
          <div class="kpi-label">{{ labels.todayScore }}</div>
          <div class="kpi-value">{{ report.total }}</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-total">
          <div class="kpi-label">{{ labels.paperTotal }}</div>
          <div class="kpi-value">{{ report.totalPossible }}</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-percent">
          <div class="kpi-label">{{ labels.percent }}</div>
          <div class="kpi-value">{{ report.percent }}%</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-count">
          <div class="kpi-label">{{ labels.questionCount }}</div>
          <div class="kpi-value">{{ questionCount }}</div>
        </div>
      </div>

      <div class="craft-note-strip">
        <div class="craft-note-strip-title">
          <span class="craft-note-strip-heading">{{ labels.noteTitle }}</span>
          <span class="tag">{{ labels.noteTag }}</span>
        </div>
        <p class="muted craft-note-strip-text">{{ reportCommentDisplay }}</p>
      </div>

      <div class="report-panels craft-report-panels">
        <div class="card craft-progress-card">
          <div class="card-title">
            <h2>{{ labels.progressTitle }}</h2>
            <span class="tag">{{ labels.profileTag }}</span>
          </div>
          <p class="muted craft-panel-intro">{{ labels.progressIntro }}</p>
          <div class="craft-progress-list">
            <div v-for="item in reportAbilityItems" :key="item.label" class="craft-progress-row">
              <div class="craft-progress-copy">
                <div class="bar-label">{{ item.label }}</div>
                <div class="craft-progress-meta">{{ item.score }} / {{ item.total }}</div>
              </div>
              <div class="craft-progress-track"><div class="craft-progress-fill" :style="{ width: item.percent + '%' }"></div></div>
              <div class="craft-progress-value">{{ item.percent }}%</div>
            </div>
          </div>
        </div>

        <div v-if="reportAbilityItems.length" class="card craft-radar-card">
          <div class="card-title">
            <h2>{{ labels.radarTitle }}</h2>
            <span class="tag">{{ labels.dynamicTag }}</span>
          </div>
          <p class="muted craft-panel-intro">{{ labels.radarIntro }}</p>
          <AbilityRadarChart :items="reportAbilityItems" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue';
import AbilityRadarChart from './AbilityRadarChart.vue';

defineEmits(['download-image', 'download-html']);

const labels = {
  title: '\u4eca\u65e5\u82f1\u8bed\u6210\u957f\u8bb0\u5f55',
  profile: '\u6210\u957f\u6863\u6848\uff1a',
  age: '\u5e74\u9f84\uff1a',
  school: '\u5b66\u6821\uff1a',
  contact: '\u8054\u7cfb\u65b9\u5f0f\uff1a',
  separator: ' \u00b7 ',
  exportImage: '\u5bfc\u51fa\u62a5\u544a\u56fe\u7247',
  downloadHtml: '\u4e0b\u8f7d\u62a5\u544a HTML',
  sticker: '\ud83c\udf1f \u624b\u5de5\u8d34\u7eb8\u680f',
  totalChipPrefix: '\ud83c\udfc6 \u603b\u5206 ',
  percentChipPrefix: '\ud83d\udcc8 \u5b8c\u6210\u7387 ',
  rewardChipPrefix: '\ud83c\udf81 \u4eca\u5929\u6536\u5230\u4e86 ',
  todayScore: '\u4eca\u5929\u5f97\u4e86\u591a\u5c11\u5206',
  paperTotal: '\u8fd9\u5f20\u5377\u5b50\u603b\u5206',
  percent: '\u5b8c\u6210\u7387',
  questionCount: '\u5b8c\u6210\u9898\u76ee',
  progressTitle: '\u542c\u8bf4\u8bfb\u8868\u73b0',
  profileTag: '\u6210\u957f\u6863\u6848',
  progressIntro: '\u50cf\u8001\u5e08\u8d34\u5728\u6559\u5ba4\u91cc\u7684\u6210\u957f\u5c0f\u5361\u4e00\u6837\uff0c\u770b\u770b\u4eca\u5929\u54ea\u4e00\u9879\u6700\u4eae\u773c\u3002',
  radarTitle: '\u80fd\u529b\u5c0f\u96f7\u8fbe',
  dynamicTag: '\u52a8\u6001\u7ef4\u5ea6',
  radarIntro: '\u7528\u4e00\u5f20\u8f7b\u677e\u7684\u5c0f\u56fe\uff0c\u770b\u770b\u542c\u3001\u8bf4\u3001\u8bfb\u7684\u6574\u4f53\u5e73\u8861\u611f\u3002',
  noteTitle: '\u8001\u5e08\u60f3\u5bf9\u4f60\u8bf4',
  noteTag: '\u6210\u957f\u4fbf\u7b7e'
};

const props = defineProps({
  student: { type: Object, default: () => ({}) },
  report: { type: Object, default: () => ({}) },
  reportAbilityItems: { type: Array, default: () => [] },
  reportCommentDisplay: { type: String, default: '' },
  questionCount: { type: Number, default: 0 },
  rewardName: { type: String, default: '' },
  showActions: { type: Boolean, default: true },
  layoutMode: { type: String, default: 'desktop' }
});

const totalChipText = computed(() => `${labels.totalChipPrefix}${props.report.total || 0} / ${props.report.totalPossible || 0}`);
const percentChipText = computed(() => `${labels.percentChipPrefix}${props.report.percent || 0}%`);
const rewardChipText = computed(() => `${labels.rewardChipPrefix}${props.rewardName}`);
</script>
