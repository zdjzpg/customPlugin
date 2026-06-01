<template>
  <div class="admin-page">
    <section class="admin-kpis">
      <article class="admin-kpi">
        <span class="admin-kpi-label">卷子总数</span>
        <strong class="admin-kpi-value">{{ totalPapers }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">当前可见</span>
        <strong class="admin-kpi-value">{{ filteredPapers.length }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">答题记录</span>
        <strong class="admin-kpi-value">{{ totalSubmissions }}</strong>
      </article>
    </section>

    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>卷子检索</h2>
        </div>
        <a-space>
          <a-button @click="refreshPapers()">刷新列表</a-button>
          <a-button type="primary" @click="createPaper">新建卷子</a-button>
        </a-space>
      </div>

      <div class="admin-filters">
        <div class="field">
          <label>卷子名称</label>
          <a-input
            v-model:value="keyword"
            placeholder="输入卷子名称关键词"
            @pressEnter="handleKeywordSearch"
          />
        </div>
        <div class="field">
          <label>题型筛选</label>
          <a-select
            v-model:value="selectedType"
            :options="typeOptions"
            placeholder="全部题型"
            allow-clear
            @change="handleTypeChange"
          />
        </div>
      </div>
    </section>

    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>卷子列表</h2>
        </div>
      </div>

      <a-table
        v-if="filteredPapers.length"
        class="admin-ant-table"
        :columns="columns"
        :data-source="filteredPapers"
        :pagination="tablePagination"
        :row-key="(record) => record.id"
        :custom-row="customRow"
        :scroll="{ x: tableScrollX }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'examTitle'">
            <router-link
              class="admin-row-link admin-router-link"
              :to="{ name: 'paper-new', query: { id: record.id } }"
            >
              {{ record.examTitle }}
            </router-link>
            <div class="admin-row-note">{{ paperSummary(record) }}</div>
          </template>

          <template v-else-if="column.key === 'typeText'">
            {{ paperTypeText(record) }}
          </template>

          <template v-else-if="column.key === 'shareCode'">
            <a-tag color="blue">{{ record.shareCode || "-" }}</a-tag>
          </template>

          <template v-else-if="column.key === 'scoreSummary'">
            {{ record.questionCount }} 题 / {{ record.totalScore }} 分
          </template>

          <template v-else-if="column.key === 'submissionCount'">
            {{ record.submissionCount || 0 }} 条
          </template>

          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space @click.stop class="admin-papers-actions">
              <a-button
                size="small"
                :disabled="!canEditPaper(record)"
                @click="editPaper(record.id)"
              >
                编辑卷子
              </a-button>
              <a-button
                type="primary"
                size="small"
                @click="openAnswers(record.id)"
              >
                答题情况
              </a-button>
              <a-dropdown trigger="click">
                <a-button size="small">
                  更多
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="({ key }) => handleMoreAction(key, record)">
                    <a-menu-item key="copy">复制卷子</a-menu-item>
                    <a-menu-item key="code">复制分享码</a-menu-item>
                    <a-menu-item key="link">复制分享链接</a-menu-item>
                    <a-menu-item key="preview">预览学生页</a-menu-item>
                    <a-menu-item key="delete" class="admin-danger-item">
                      删除卷子
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else class="empty admin-empty">
        没有匹配的卷子，换个关键词或筛选条件再看。
      </div>
    </section>
  </div>
</template>

<script setup>
import { DownOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import paperEditPolicy from "../shared/paperEditPolicy";
import { useExamStore } from "../store/examStore";

const { canEditPaper } = paperEditPolicy;
const router = useRouter();
const {
  TYPE_META,
  configuredPapers,
  paperPagination,
  createNewPaper,
  copyPaper,
  fetchPapers,
  removePaper,
  state,
  buildShareLink,
} = useExamStore();
const keyword = ref("");
const selectedType = ref(undefined);
const viewportWidth = ref(
  typeof window === "undefined" ? 1600 : window.innerWidth,
);

const filteredPapers = computed(() => configuredPapers.value);
const totalPapers = computed(() => Number(paperPagination.value.total || 0));
const totalSubmissions = computed(() =>
  configuredPapers.value.reduce(
    (sum, paper) => sum + Number(paper.submissionCount || 0),
    0,
  ),
);
const typeOptions = computed(() => [
  { label: "全部题型", value: "" },
  ...Object.entries(TYPE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
]);
const columns = computed(() => {
  const base = [
    { title: "卷子名称", key: "examTitle", dataIndex: "examTitle", width: 240 },
    { title: "题型概览", key: "typeText", width: 220 },
    { title: "分享码", key: "shareCode", width: 110 },
    { title: "题数 / 总分", key: "scoreSummary", width: 120 },
    { title: "答题记录", key: "submissionCount", width: 110 },
    { title: "最近更新", key: "updatedAt", width: 170 },
    {
      title: "操作",
      key: "actions",
      width: 300,
      align: "right",
      fixed: "right",
    },
  ];

  if (state.authUser?.role === "ADMIN") {
    base.splice(5, 0, {
      title: "归属员工",
      dataIndex: "ownerUsername",
      key: "ownerUsername",
      width: 140,
    });
  }

  return base;
});
const tableScrollX = computed(() =>
  columns.value.reduce((sum, column) => sum + Number(column.width || 0), 0),
);
const tablePagination = computed(() => ({
  current: Number(paperPagination.value.page || 1),
  pageSize: Number(paperPagination.value.pageSize || 10),
  total: Number(paperPagination.value.total || 0),
  showSizeChanger: false,
  hideOnSinglePage: false,
  showTotal: (total) => `共 ${total} 条`,
}));

onMounted(async () => {
  window.addEventListener("resize", handleViewportResize);
  await refreshPapers(1);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleViewportResize);
});

function createPaper() {
  createNewPaper();
  router.push({ name: "paper-new" });
}

function editPaper(paperId) {
  router.push({ name: "paper-new", query: { id: paperId } });
}

function openAnswers(paperId) {
  router.push({ name: "answers", query: { paperId } });
}

function previewPaper(shareCode) {
  if (!shareCode) {
    return;
  }
  router.push({ name: "paper", params: { shareCode } });
}

async function copyPaperAndRefresh(paperId) {
  await copyPaper(paperId);
  message.success("卷子已复制");
}

function deletePaperAndRefresh(paperId) {
  Modal.confirm({
    title: "确认删除这张卷子吗？",
    content: "删除后不可恢复，学生端分享码也会失效。",
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { danger: true },
    async onOk() {
      await removePaper(paperId);
      message.success("卷子已删除");
    },
  });
}

async function copyShareCode(shareCode) {
  if (!shareCode) {
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareCode);
    message.success(`分享码 ${shareCode} 已复制`);
    return;
  }
  window.prompt("请复制以下分享码：", shareCode);
}

async function copyShareLink(shareCode) {
  const link = buildShareLink(shareCode);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    message.success("分享链接已复制");
    return;
  }
  window.prompt("请复制以下分享链接：", link);
}

function handleMoreAction(actionKey, paper) {
  if (actionKey === "copy") {
    copyPaperAndRefresh(paper.id);
  } else if (actionKey === "code") {
    copyShareCode(paper.shareCode);
  } else if (actionKey === "link") {
    copyShareLink(paper.shareCode);
  } else if (actionKey === "preview") {
    previewPaper(paper.shareCode);
  } else if (actionKey === "delete") {
    deletePaperAndRefresh(paper.id);
  }
}

async function refreshPapers(page = paperPagination.value.page, pageSize = paperPagination.value.pageSize) {
  const nextKeyword = keyword.value.trim();
  const nextQuestionType = selectedType.value || "";
  const filtersChanged =
    nextKeyword !== (state.paperFilters?.keyword || "") ||
    nextQuestionType !== (state.paperFilters?.questionType || "");

  await fetchPapers({
    keyword: nextKeyword,
    questionType: nextQuestionType,
    page: filtersChanged ? 1 : page,
    pageSize,
  });
}

async function handleKeywordSearch() {
  await refreshPapers(1);
}

async function handleTypeChange() {
  await refreshPapers(1);
}

async function handleTableChange(pagination) {
  await refreshPapers(pagination.current, pagination.pageSize);
}

function customRow(record) {
  return {
    onDblclick: () => editPaper(record.id),
  };
}

function paperTypeText(paper) {
  const rawTypes = Array.isArray(paper.questionTypes) && paper.questionTypes.length
    ? paper.questionTypes
    : (paper.questions || []).map((question) => question.type);
  const labels = rawTypes
    .map((type) => TYPE_META[type]?.label || type)
    .filter(Boolean);
  return labels.length ? labels.join(" / ") : "未配置题型";
}

function paperSummary(paper) {
  return paper.themeNote || paper.welcomeSpeech || "暂无卷子说明";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function handleViewportResize() {
  viewportWidth.value = window.innerWidth;
}
</script>
