<template>
  <div class="app-shell">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">{{ state.config.examTitle }}</h1>
          <p class="hero-subtitle">{{ state.config.welcomeSpeech }}</p>
        </div>
      </div>
      <div class="chip-row">
        <div class="chip">📝 {{ state.config.questions.length }} 道题</div>
        <div class="chip">⭐ 总分 {{ totalScore }}</div>
        <div class="chip">🚫 学生端不暴露配置入口</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="card">
        <div class="card-title"><h2>试卷亮点</h2><span class="tag">Step 2</span></div>
        <div class="stack">
          <div class="info-badge">🔊 听音选图 + 看图选词</div>
          <div class="info-badge">🧩 组句闯关 + 跟读练习</div>
          <div class="info-badge">✍️ 拼写填空 + 图表报告</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h2>填写学生信息</h2><span class="tag">开始答题</span></div>
        <div class="field-grid two">
          <div class="field"><label>姓名</label><input v-model="state.student.name" placeholder="例如：小可爱" /></div>
          <div class="field"><label>手机号</label><input v-model="state.student.phone" placeholder="家长手机号" /></div>
          <div class="field"><label>年龄</label><input v-model="state.student.age" placeholder="例如：6" /></div>
          <div class="field"><label>学校</label><input v-model="state.student.school" placeholder="例如：星光小学" /></div>
          <div class="field" style="grid-column: 1 / -1;"><label>年级 / 班级</label><input v-model="state.student.grade" placeholder="例如：中班 / 一年级" /></div>
        </div>
        <div class="footer-actions">
          <span class="muted tiny">这是学生入口，没有跳回配置页的按钮。</span>
          <button class="btn btn-primary" @click="beginExam">开始闯关</button>
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
const { state, totalScore, startExam, initFromEncodedPaper } = useExamStore();

const encodedPaper = typeof route.query.paper === 'string' ? route.query.paper : '';
if (encodedPaper) {
  initFromEncodedPaper(encodedPaper);
}

function beginExam() {
  startExam();
  router.push({ name: 'exam', query: route.query });
}
</script>
