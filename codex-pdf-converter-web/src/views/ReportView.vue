<template>
  <div ref="reportCaptureRef" class="app-shell" v-if="state.report">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">今日英语成长记录</h1>
          <p class="hero-subtitle">成长档案：{{ state.student.name || '-' }} · 年龄：{{ state.student.age || '-' }} · 学校：{{ state.student.school || '-' }} · 联系方式：{{ state.student.phone || '-' }}</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" @click="restartAndBack">重新作答</button>
          <button class="btn btn-ghost" @click="router.push({ name: 'records', query: route.query })">查看作答记录</button>
          <button class="btn btn-secondary" @click="downloadReportImage">导出报告图片</button>
          <button class="btn btn-primary" @click="downloadReport">下载报告 HTML</button>
        </div>
      </div>
      <div class="chip-row craft-sticker-row">
        <div class="chip craft-sticker">🌟 手工贴纸栏</div>
        <div class="chip craft-sticker">🏆 总分 {{ state.report.total }} / {{ state.report.totalPossible }}</div>
        <div class="chip craft-sticker">📈 完成率 {{ state.report.percent }}%</div>
        <div class="chip craft-sticker">📘 成长档案</div>
      </div>
    </div>

    <div class="report-grid report-craft-shell">
      <div class="summary-kpis craft-kpi-grid">
        <div class="kpi craft-kpi craft-kpi-score">
          <div class="kpi-label">今天得了多少分</div>
          <div class="kpi-value">{{ state.report.total }}</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-total">
          <div class="kpi-label">这张卷子总分</div>
          <div class="kpi-value">{{ state.report.totalPossible }}</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-percent">
          <div class="kpi-label">完成率</div>
          <div class="kpi-value">{{ state.report.percent }}%</div>
        </div>
        <div class="kpi craft-kpi craft-kpi-count">
          <div class="kpi-label">完成题目</div>
          <div class="kpi-value">{{ reportQuestionCount }}</div>
        </div>
      </div>

      <div class="report-panels craft-report-panels">
        <div class="card craft-progress-card">
          <div class="card-title"><h2>听说读表现</h2><span class="tag">成长档案</span></div>
          <p class="muted craft-panel-intro">像老师贴在教室里的成长小卡一样，看看今天哪一项最亮眼。</p>
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
        <div class="card craft-radar-card">
          <div class="card-title"><h2>能力小雷达</h2><span class="tag">动态维度</span></div>
          <p class="muted craft-panel-intro">用一张轻松的小图，看看听、说、读的整体平衡感。</p>
          <AbilityRadarChart :items="reportAbilityItems" />
        </div>
      </div>

      <div class="card craft-note-card">
        <div class="card-title"><h2>老师想对你说</h2><span class="tag">成长便签</span></div>
        <div class="stack">
          <p class="muted craft-note-text">{{ reportCommentDisplay }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { ref } from 'vue';
import { toPng } from 'html-to-image';
import AbilityRadarChart from '../components/shared/AbilityRadarChart.vue';
import questionAbilitiesUtils from '../shared/questionAbilities';
import reportCommentsUtils from '../shared/reportComments';
import reportImageExportUtils from '../shared/reportImageExport';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const route = useRoute();
const { state, downloadReport, restartExam } = useExamStore();
const { REPORT_ABILITIES } = questionAbilitiesUtils;
const { formatReportCommentsInline } = reportCommentsUtils;
const { buildReportImageOptions } = reportImageExportUtils;
const reportCaptureRef = ref(null);
const reportQuestionCount = computed(() => state.paper?.questions?.length || state.currentPaper?.questions?.length || 0);
const reportAbilityItems = computed(() => REPORT_ABILITIES
  .filter((label) => state.report?.abilityMap?.[label]?.total > 0)
  .map((label) => {
    const item = state.report.abilityMap[label];
    return {
      label,
      score: item.score,
      total: item.total,
      percent: item.total ? Math.round((item.score / item.total) * 100) : 0
    };
  }));
const reportCommentLine = computed(() => formatReportCommentsInline(state.report?.comments));
const reportCommentDisplay = computed(() => reportCommentLine.value || '今天完成得很认真，继续把你的英语小本领一点点收集起来吧。');

function restartAndBack() {
  restartExam();
  router.push({ name: 'intake', query: route.query });
}

async function downloadReportImage() {
  if (!reportCaptureRef.value) {
    return;
  }
  const dataUrl = await toPng(reportCaptureRef.value, buildReportImageOptions());
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `english-report-${Date.now()}.png`;
  link.click();
}
</script>
