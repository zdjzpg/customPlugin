<template>
  <div class="admin-page">
    <section class="admin-kpis">
      <article class="admin-kpi">
        <span class="admin-kpi-label">当前卷子</span>
        <strong class="admin-kpi-value text-lg">{{ currentPaperTitle }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">提交数</span>
        <strong class="admin-kpi-value">{{ filteredSubmissions.length }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">平均得分率</span>
        <strong class="admin-kpi-value">{{ averagePercent }}%</strong>
      </article>
    </section>

    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>记录筛选</h2>
        </div>
        <a-space>
          <a-button @click="goBack">返回卷子列表</a-button>
          <a-button @click="editPaper" :disabled="!selectedPaperId">编辑卷子</a-button>
          <a-button type="primary" @click="reloadSubmissions">刷新记录</a-button>
        </a-space>
      </div>

      <div class="admin-filters admin-filters-compact">
        <div class="field">
          <label>当前卷子</label>
          <a-input :value="currentPaperTitle" readonly />
        </div>
        <div class="field">
          <label>学生检索</label>
          <a-input v-model:value="studentKeyword" placeholder="输入姓名或手机号" />
        </div>
      </div>
    </section>

    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>提交记录</h2>
        </div>
      </div>

      <a-table
        v-if="filteredSubmissions.length"
        class="admin-ant-table"
        :columns="columns"
        :data-source="filteredSubmissions"
        :pagination="false"
        :row-key="(record) => record.id"
        :expanded-row-keys="expandedRowKeys"
        :show-expand-column="false"
        :scroll="{ x: 1080 }"
        @expand="handleRowExpand"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'studentName'">
            <a-button type="link" class="admin-row-link" @click="toggleExpanded(record.id)">
              {{ record.student.name || '未填写姓名' }}
            </a-button>
          </template>

          <template v-else-if="column.key === 'studentPhone'">
            {{ record.student.phone || '-' }}
          </template>

          <template v-else-if="column.key === 'studentBaseInfo'">
            {{ studentBaseInfo(record.student) }}
          </template>

          <template v-else-if="column.key === 'scoreSummary'">
            {{ record.report.total }} / {{ record.report.totalPossible }}
          </template>

          <template v-else-if="column.key === 'percent'">
            <a-tag color="blue">{{ record.report.percent }}%</a-tag>
          </template>

          <template v-else-if="column.key === 'submittedAt'">
            {{ formatDate(record.submittedAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space wrap class="admin-answer-actions">
              <a-button type="primary" size="small" @click="toggleExpanded(record.id)">
                {{ expandedSubmissionId === record.id ? '收起明细' : '查看明细' }}
              </a-button>
              <a-button
                size="small"
                :loading="generatingSubmissionId === record.id"
                @click="downloadSubmissionReportImage(record)"
              >
                生成报告图片
              </a-button>
              <a-button size="small" :disabled="!record.reward" @click="openRewardModal(record)">查看礼品</a-button>
            </a-space>
          </template>
        </template>

        <template #expandedRowRender="{ record }">
          <div class="admin-detail-grid">
            <div class="admin-detail-card">
              <h3>学生信息</h3>
              <p>{{ studentSummary(record.student) }}</p>
            </div>
            <div class="admin-detail-card">
              <h3>整体结果</h3>
              <p>{{ reportSummary(record.report) }}</p>
            </div>
          </div>

          <a-table
            class="admin-ant-subtable"
            :columns="detailColumns"
            :data-source="record.records"
            :pagination="false"
            :row-key="(item) => `${record.id}_${item.index}`"
            size="small"
          />
        </template>
      </a-table>

      <div v-else class="empty admin-empty">当前卷子下没有匹配的答题记录。</div>
    </section>

    <a-modal v-model:open="rewardModalOpen" title="学员获得礼品" :footer="null">
      <div class="stack">
        <div class="info-badge">礼品名称：{{ rewardModalSubmission?.reward?.name || '未获得礼品' }}</div>
        <p class="muted">{{ rewardModalSubmission?.reward?.description || '当前仅记录礼品文字内容。' }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { createApp, computed, h, nextTick, onMounted, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { toPng } from 'html-to-image';
import { useRoute, useRouter } from 'vue-router';
import SubmissionReportCapture from '../components/shared/SubmissionReportCapture.vue';
import reportImageExportUtils from '../shared/reportImageExport';
import reportLayoutModeUtils from '../shared/reportLayoutMode';
import submissionReportSnapshotUtils from '../shared/submissionReportSnapshot';
import { useExamStore } from '../store/examStore';

const { buildReportImageOptions } = reportImageExportUtils;
const { resolveReportLayoutMode } = reportLayoutModeUtils;
const { buildSubmissionReportSnapshot } = submissionReportSnapshotUtils;
const router = useRouter();
const route = useRoute();
const { configuredPapers, fetchPapers, loadSubmissionsByPaper, state } = useExamStore();
const studentKeyword = ref('');
const expandedSubmissionId = ref('');
const generatingSubmissionId = ref('');
const rewardModalOpen = ref(false);
const rewardModalSubmission = ref(null);
const selectedPaperId = computed(() => (typeof route.query.paperId === 'string' ? route.query.paperId : ''));

const currentPaperTitle = computed(() => {
  const paper = configuredPapers.value.find((item) => item.id === selectedPaperId.value);
  return paper ? paper.examTitle : '未找到卷子';
});

const filteredSubmissions = computed(() => state.submissions.filter((submission) => {
  const keyword = studentKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  const studentText = `${submission.student.name || ''} ${submission.student.phone || ''}`.toLowerCase();
  return studentText.includes(keyword);
}));

const averagePercent = computed(() => {
  if (!filteredSubmissions.value.length) {
    return 0;
  }
  const total = filteredSubmissions.value.reduce((sum, submission) => sum + Number(submission.report.percent || 0), 0);
  return Math.round(total / filteredSubmissions.value.length);
});
const expandedRowKeys = computed(() => (expandedSubmissionId.value ? [expandedSubmissionId.value] : []));

const columns = [
  { title: '学生', key: 'studentName', width: 160 },
  { title: '手机号', key: 'studentPhone', width: 140 },
  { title: '年龄 / 年级 / 学校', key: 'studentBaseInfo', width: 220 },
  { title: '得分', key: 'scoreSummary', width: 120 },
  { title: '完成率', key: 'percent', width: 120 },
  { title: '提交时间', key: 'submittedAt', width: 180 },
  { title: '操作', key: 'actions', width: 360, align: 'right' }
];

const detailColumns = [
  { title: '题号', dataIndex: 'index', key: 'index', width: 80 },
  { title: '题型', key: 'type', width: 160, customRender: ({ record }) => record.meta?.label || '-' },
  { title: '学生作答', key: 'studentText', customRender: ({ record }) => renderStudentAnswer(record) },
  { title: '标准答案', dataIndex: 'correctText', key: 'correctText' },
  { title: '得分', key: 'score', customRender: ({ record }) => `${record.gained} / ${record.total}`, width: 120 }
];

onMounted(async () => {
  await fetchPapers();
  await loadSubmissionsByPaper(selectedPaperId.value);
});

async function reloadSubmissions() {
  await loadSubmissionsByPaper(selectedPaperId.value);
}

function goBack() {
  router.push({ name: 'papers' });
}

function editPaper() {
  if (!selectedPaperId.value) {
    return;
  }
  router.push({ name: 'paper-new', query: { id: selectedPaperId.value } });
}

function toggleExpanded(submissionId) {
  expandedSubmissionId.value = expandedSubmissionId.value === submissionId ? '' : submissionId;
}

function handleRowExpand(expanded, record) {
  expandedSubmissionId.value = expanded ? record.id : '';
}

function renderStudentAnswer(record) {
  const nodes = [];
  const shouldShowStudentText = record.studentText !== '未识别' || !record.audioUrl;

  if (shouldShowStudentText) {
    nodes.push(
      h('div', { class: 'admin-answer-text' }, record.studentText || '未作答')
    );
  }

  if (record.audioUrl) {
    nodes.push(
      h('audio', {
        class: 'admin-answer-audio',
        controls: true,
        preload: 'none',
        src: record.audioUrl
      })
    );
  }

  return h('div', { class: 'admin-answer-response' }, nodes);
}

async function downloadSubmissionReportImage(submission) {
  if (!submission || generatingSubmissionId.value) {
    return;
  }

  const mountHost = document.createElement('div');
  let app = null;
  generatingSubmissionId.value = submission.id;

  try {
    const captureWidth = 1280;
    mountHost.style.position = 'fixed';
    mountHost.style.left = '-10000px';
    mountHost.style.top = '0';
    mountHost.style.width = `${captureWidth}px`;
    mountHost.style.pointerEvents = 'none';
    mountHost.style.zIndex = '-1';
    document.body.appendChild(mountHost);

    const selectedPaper = configuredPapers.value.find((item) => item.id === submission.paperId) || null;
    const snapshot = buildSubmissionReportSnapshot({
      submission,
      paper: selectedPaper || {}
    });
    const captureLayoutMode = resolveReportLayoutMode(captureWidth, typeof window === 'undefined' ? 1080 : window.innerHeight);

    app = createApp(SubmissionReportCapture, {
      ...snapshot,
      layoutMode: captureLayoutMode
    });
    app.mount(mountHost);

    await nextTick();
    await waitForSubmissionCaptureReady();

    const captureNode = mountHost.firstElementChild || mountHost;
    const dataUrl = await toPng(captureNode, buildReportImageOptions());
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `submission-report-${submission.id}.png`;
    link.click();
    message.success('报告图片已生成');
  } catch (error) {
    message.error('生成报告图片失败，请稍后重试');
  } finally {
    if (app) {
      app.unmount();
    }
    mountHost.remove();
    generatingSubmissionId.value = '';
  }
}

function openRewardModal(submission) {
  rewardModalSubmission.value = submission;
  rewardModalOpen.value = true;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function studentBaseInfo(student) {
  return `${student.age || '-'} 岁 / ${student.grade || '-'} / ${student.school || '-'}`;
}

function studentSummary(student) {
  return `姓名：${student.name || '-'}\n电话：${student.phone || '-'}\n年龄：${student.age || '-'}\n学校：${student.school || '-'}\n年级：${student.grade || '-'}`;
}

function reportSummary(report) {
  return `总分：${report.total} / ${report.totalPossible}\n完成率：${report.percent}%`;
}

async function waitForSubmissionCaptureReady() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  for (let frame = 0; frame < 4; frame += 1) {
    await new Promise((resolve) => {
      window.requestAnimationFrame(resolve);
    });
  }
}

watch(selectedPaperId, async (paperId, previousPaperId) => {
  if (!paperId || paperId === previousPaperId) {
    return;
  }
  expandedSubmissionId.value = '';
  await loadSubmissionsByPaper(paperId);
});
</script>
