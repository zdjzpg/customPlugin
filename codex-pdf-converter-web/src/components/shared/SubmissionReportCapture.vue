<template>
  <div class="app-shell paper-view-shell-report submission-report-capture">
    <StudentCraftReport
      :student="student"
      :report="report"
      :report-ability-items="reportAbilityItems"
      :report-comment-display="reportCommentDisplay"
      :question-count="questionCount"
      :reward-name="reward?.name || ''"
      :layout-mode="layoutMode"
    />
  </div>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue';
import StudentCraftReport from './StudentCraftReport.vue';
import questionAbilitiesUtils from '../../shared/questionAbilities';
import reportCommentsUtils from '../../shared/reportComments';

const { REPORT_ABILITIES } = questionAbilitiesUtils;
const { formatReportCommentsInline } = reportCommentsUtils;

const props = defineProps({
  student: { type: Object, default: () => ({}) },
  report: { type: Object, default: () => ({}) },
  questionCount: { type: Number, default: 0 },
  reward: { type: Object, default: null },
  layoutMode: { type: String, default: 'desktop' }
});

const reportCommentLine = computed(() => formatReportCommentsInline(props.report?.comments));
const reportCommentDisplay = computed(() => reportCommentLine.value || '\u4eca\u5929\u5b8c\u6210\u5f97\u5f88\u8ba4\u771f\uff0c\u7ee7\u7eed\u628a\u4f60\u7684\u82f1\u8bed\u5c0f\u672c\u9886\u4e00\u70b9\u70b9\u6536\u96c6\u8d77\u6765\u5427\u3002');

const reportAbilityItems = computed(() => {
  if (Array.isArray(props.report?.abilityItems) && props.report.abilityItems.length) {
    return props.report.abilityItems.map((item) => ({
      label: item.label,
      score: Number(item.score || 0),
      total: Number(item.total || 0),
      percent: Number(item.percent || 0)
    }));
  }

  return REPORT_ABILITIES
    .filter((label) => props.report?.abilityMap?.[label]?.total > 0)
    .map((label) => {
      const item = props.report.abilityMap[label];
      return {
        label,
        score: Number(item.score || 0),
        total: Number(item.total || 0),
        percent: item.total ? Math.round((Number(item.score || 0) / Number(item.total || 0)) * 100) : 0
      };
    });
});
</script>

<style scoped>
.submission-report-capture,
.submission-report-capture .hero-title,
.submission-report-capture .hero-subtitle,
.submission-report-capture .chip,
.submission-report-capture .kpi-label,
.submission-report-capture .kpi-value,
.submission-report-capture .card-title,
.submission-report-capture .muted,
.submission-report-capture .tag {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
}
</style>
