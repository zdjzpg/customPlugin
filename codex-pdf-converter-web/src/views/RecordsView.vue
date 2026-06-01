<template>
  <div class="app-shell">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">作答记录</h1>
          <p class="hero-subtitle">这里单独展示每一道题的学生答案、标准答案和得分，方便老师复盘。</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" @click="router.push({ name: 'report', query: route.query })">返回报告页</button>
        </div>
      </div>
      <div class="chip-row">
        <div class="chip">👧 {{ state.student.name || '-' }}</div>
        <div class="chip">📱 {{ state.student.phone || '-' }}</div>
        <div class="chip">🏫 {{ state.student.school || '-' }}</div>
        <div class="chip">📝 {{ recordItems.length }} 条记录</div>
      </div>
    </div>

    <div class="report-grid">
      <div class="question-list">
        <div v-for="item in recordItems" :key="item.index" class="question-editor">
          <div class="question-editor-header">
            <div>
              <div class="tag">第 {{ item.index }} 题</div>
              <h3>{{ item.meta.icon }} {{ item.meta.label }}</h3>
            </div>
            <div class="toolbar">
              <span class="tag">{{ item.meta.ability }}能力</span>
              <span :class="item.status === '通过' ? 'status-pass' : 'status-warn'">{{ item.gained }} / {{ item.total }}</span>
            </div>
          </div>
          <div class="question-editor-body">
            <div class="field-grid two">
              <div class="field"><label>题目提示</label><input :value="item.prompt" readonly /></div>
              <div class="field"><label>结果</label><input :value="item.status" readonly /></div>
              <div class="field"><label>学生作答</label><textarea readonly :value="item.studentText"></textarea></div>
              <div class="field"><label>标准答案</label><textarea readonly :value="item.correctText"></textarea></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const route = useRoute();
const { state, recordItems } = useExamStore();
</script>
