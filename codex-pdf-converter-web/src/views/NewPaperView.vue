<template>
  <div class="admin-page">
    <section class="admin-editor-grid">
      <div class="stack">
        <div class="admin-section">
          <div class="admin-section-header">
            <div>
              <h2>添加题型</h2>
            </div>
          </div>

          <a-space wrap>
            <a-button
              v-for="(meta, type) in visibleTypeMeta"
              :key="type"
              class="admin-type-button"
              @click="addQuestion(type)"
            >
              {{ meta.icon }} {{ meta.label }}
            </a-button>
          </a-space>
        </div>

        <div class="admin-section">
          <div class="admin-section-header">
            <div>
              <h2>卷子基础信息</h2>
            </div>
          </div>

          <a-alert class="admin-inline-alert" :type="scoreAlert.type" :message="scoreAlert.message" show-icon />

          <a-form layout="vertical" class="admin-ant-form">
            <a-form-item label="测评名称">
              <a-input v-model:value="state.editingPaper.examTitle" />
            </a-form-item>
            <a-form-item label="欢迎语">
              <a-textarea v-model:value="state.editingPaper.welcomeSpeech" :rows="4" />
            </a-form-item>
            <a-form-item label="页面说明">
              <a-textarea v-model:value="state.editingPaper.themeNote" :rows="4" />
            </a-form-item>
          </a-form>
        </div>

        <div class="admin-section">
          <div class="admin-section-header">
            <div>
              <h2>互动奖励</h2>
            </div>
          </div>

          <a-form layout="vertical" class="admin-ant-form">
            <div class="field-grid two">
              <a-form-item label="开屏动画">
                <a-switch v-model:checked="state.editingPaper.rewardConfig.openingAnimationEnabled" />
              </a-form-item>
              <a-form-item label="完成动画">
                <a-switch v-model:checked="state.editingPaper.rewardConfig.finishAnimationEnabled" />
              </a-form-item>
              <a-form-item class="field-span-full" label="开启转盘抽奖">
                <a-switch v-model:checked="state.editingPaper.rewardConfig.enabled" />
              </a-form-item>
            </div>

            <a-form-item v-if="state.editingPaper.rewardConfig.enabled" label="转盘奖品与概率">
              <div class="reward-editor-list">
                <div v-for="item in (state.editingPaper.rewardConfig.items || [])" :key="item.id" class="reward-editor-row">
                  <ImageUploadField
                    :model-value="item.imageUrl"
                    button-text="上传礼品图"
                    replace-text="更换礼品图"
                    compact
                    layout="side-actions"
                    @update:modelValue="item.imageUrl = $event"
                  />
                  <a-input v-model:value="item.name" placeholder="礼品名称" />
                  <a-input-number v-model:value="item.probability" :min="1" :style="{ width: '100%' }" placeholder="概率权重" />
                  <a-button danger @click="removeRewardItem(item.id)">删除</a-button>
                </div>
                <a-button dashed @click="addRewardItem">新增礼品</a-button>
              </div>
            </a-form-item>
          </a-form>
        </div>

        <div class="admin-section">
          <div class="admin-section-header">
            <div>
              <h2>报告评语</h2>
            </div>
          </div>

          <a-form layout="vertical" class="admin-ant-form">
            <a-form-item label="开头评语">
              <a-textarea v-model:value="state.editingPaper.commentConfig.opening" :rows="3" />
            </a-form-item>
            <a-form-item label="中间评语（按分数命中）">
              <div class="reward-editor-list">
                <div
                  v-for="item in (state.editingPaper.commentConfig.bands || [])"
                  :key="item.id"
                  class="reward-editor-row"
                >
                  <a-input-number v-model:value="item.minScore" :min="0" :style="{ width: '100%' }" placeholder="大于等于多少分" />
                  <a-textarea v-model:value="item.text" :rows="2" placeholder="该分数段显示的评语" />
                  <div></div>
                  <a-button danger @click="removeCommentBand(item.id)">删除</a-button>
                </div>
                <a-button dashed @click="addCommentBand">新增评语档位</a-button>
              </div>
            </a-form-item>
            <a-form-item label="结尾评语">
              <a-textarea v-model:value="state.editingPaper.commentConfig.closing" :rows="3" />
            </a-form-item>
          </a-form>
        </div>

      </div>

      <div class="stack">
        <div class="admin-section">
          <div class="admin-section-header">
            <div>
              <h2>题目列表</h2>
            </div>
            <a-tag color="blue">{{ state.editingPaper.questions.length }} 题</a-tag>
          </div>

          <div class="question-list">
            <a-card
              v-for="(question, index) in state.editingPaper.questions"
              :key="question.id"
              class="admin-question-card"
              size="small"
            >
              <template #title>
                <div class="admin-question-card-title">
                  <div class="admin-question-card-meta">
                    <a-tag color="blue">第 {{ index + 1 }} 题</a-tag>
                    <strong>{{ TYPE_META[question.type].icon }} {{ TYPE_META[question.type].label }}</strong>
                  </div>
                  <a-space wrap class="admin-question-card-actions">
                    <a-tag :color="getQuestionDifficultyColor(question.difficulty)">{{ questionDifficultyLabel(question) }}</a-tag>
                    <a-tag>{{ questionAbilityLabel(question) }}</a-tag>
                    <a-button size="small" @click="duplicateQuestion(question.id)">复制</a-button>
                    <a-button size="small" danger @click="removeQuestion(question.id)">删除</a-button>
                  </a-space>
                </div>
              </template>

              <a-form layout="vertical" class="admin-ant-form">
                <div class="field-grid two">
                  <a-form-item label="题目提示">
                    <a-input v-model:value="question.prompt" />
                  </a-form-item>
                  <a-form-item label="本题分数">
                    <a-input-number v-model:value="question.score" :min="0" :style="{ width: '100%' }" />
                  </a-form-item>
                  <a-form-item label="题目等级">
                    <a-select
                      v-model:value="question.difficulty"
                      :options="questionDifficultyOptions"
                      placeholder="请选择题目等级"
                    />
                  </a-form-item>
                  <a-form-item class="field-span-full" label="能力维度">
                    <a-select
                      :value="question.abilities"
                      mode="multiple"
                      :options="abilityOptions"
                      :max-tag-count="2"
                      placeholder="请选择题目所属的能力维度"
                      @change="handleAbilityChange(question, $event)"
                    />
                  </a-form-item>
                </div>

                <template v-if="question.type === 'listen_choose_image'">
                  <ListenChooseImageEditor :question="question" @patch="patchQuestion(question, $event)" />
                </template>

                <template v-else-if="question.type === 'listen_follow_instruction'">
                  <FollowInstructionEditor :question="question" @patch="patchQuestion(question, $event)" />
                </template>

                <template v-else-if="question.type === 'look_choose_word'">
                  <LookChooseWordEditor :question="question" @patch="patchQuestion(question, $event)" />
                </template>

                <template v-else-if="question.type === 'sentence_sort'">
                  <a-form-item label="目标句子">
                    <a-input v-model:value="question.sentence" />
                  </a-form-item>
                </template>

                <template v-else-if="question.type === 'read_aloud'">
                  <div class="field-grid two">
                    <a-form-item label="跟读内容">
                      <a-input v-model:value="question.phrase" />
                    </a-form-item>
                    <a-form-item label="展示标题">
                      <a-input v-model:value="question.mascotWord" />
                    </a-form-item>
                  </div>
                </template>

                <template v-else-if="question.type === 'listen_answer_question'">
                  <div class="field-grid two">
                    <a-form-item class="field-span-full" label="问题内容">
                      <a-input v-model:value="question.questionText" />
                    </a-form-item>
                    <a-form-item label="关键词（英文逗号分隔）">
                      <a-input v-model:value="question.answerKeywordsText" />
                    </a-form-item>
                    <a-form-item label="命中几个关键词算对">
                      <a-input-number v-model:value="question.minMatchCount" :min="1" :style="{ width: '100%' }" />
                    </a-form-item>
                  </div>
                </template>

                <template v-else-if="question.type === 'listen_choose_letter'">
                  <div class="field-grid two">
                    <a-form-item label="目标字母">
                      <a-input v-model:value="question.targetLetter" :maxlength="1" />
                    </a-form-item>
                    <a-form-item label="候选字母（英文逗号分隔）">
                      <a-input v-model:value="question.candidateLettersText" />
                    </a-form-item>
                    <a-form-item class="field-span-full" label="是否要求大小写同时选择">
                      <a-select v-model:value="question.requireBothCases" :options="caseModeOptions" />
                    </a-form-item>
                  </div>
                </template>

                <template v-else-if="question.type === 'read_sentence_with_image'">
                  <div class="field-grid two">
                    <a-form-item label="上传图片">
                      <ImageUploadField
                        :model-value="question.imageUrl"
                        @update:modelValue="question.imageUrl = $event"
                      />
                    </a-form-item>
                    <a-form-item label="句子内容">
                      <a-input v-model:value="question.sentenceText" />
                    </a-form-item>
                  </div>
                </template>

                <template v-else-if="question.type === 'match_image_word'">
                  <a-form-item label="图片单词配对">
                    <div class="match-editor-list">
                      <div v-for="pair in (question.pairs || [])" :key="pair.id" class="match-editor-row">
                        <ImageUploadField
                          :model-value="pair.imageUrl"
                          button-text="上传图片"
                          compact
                          @update:modelValue="pair.imageUrl = $event"
                        />
                        <a-input v-model:value="pair.word" placeholder="英文单词" />
                        <a-button danger @click="removeMatchPair(question, pair.id)">删除</a-button>
                      </div>
                      <a-button dashed @click="addMatchPair(question)">新增一组配对</a-button>
                    </div>
                  </a-form-item>
                </template>

                <template v-else>
                  <div class="field-grid two">
                    <a-form-item label="答案单词">
                      <a-input v-model:value="question.answerWord" />
                    </a-form-item>
                    <a-form-item label="挖空位置（从0开始，逗号分隔）">
                      <a-input v-model:value="question.blankIndexesText" />
                    </a-form-item>
                  </div>
                </template>
              </a-form>
            </a-card>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useExamStore } from '../store/examStore';
import FollowInstructionEditor from '../components/editors/FollowInstructionEditor.vue';
import ImageUploadField from '../components/editors/ImageUploadField.vue';
import ListenChooseImageEditor from '../components/editors/ListenChooseImageEditor.vue';
import LookChooseWordEditor from '../components/editors/LookChooseWordEditor.vue';
import questionAbilitiesUtils from '../shared/questionAbilities';
import questionDifficultyUtils from '../shared/questionDifficulty';
import reportCommentsUtils from '../shared/reportComments';
import { uid } from '../utils/content';

const route = useRoute();
const {
  state,
  TYPE_META,
  createNewPaper,
  loadPaperForEdit,
  addQuestion,
  duplicateQuestion,
  removeQuestion
} = useExamStore();
const { REPORT_ABILITIES, getDefaultAbilitiesForType } = questionAbilitiesUtils;
const {
  QUESTION_DIFFICULTY_OPTIONS,
  getQuestionDifficultyColor,
  getQuestionDifficultyLabel
} = questionDifficultyUtils;
const { createDefaultReportCommentConfig } = reportCommentsUtils;
const HIDDEN_QUESTION_TYPES = ['sentence_sort', 'spell_blank', 'match_image_word'];

const abilityOptions = REPORT_ABILITIES.map((value) => ({ label: value, value }));
const questionDifficultyOptions = QUESTION_DIFFICULTY_OPTIONS;
const visibleTypeMeta = computed(() => Object.fromEntries(
  Object.entries(TYPE_META).filter(([type]) => !HIDDEN_QUESTION_TYPES.includes(type))
));
const caseModeOptions = [
  { label: '关闭，只选一个即可', value: false },
  { label: '开启，必须同时选择大小写', value: true }
];

const scoreAlert = computed(() => {
  if (!state.editingPaper.questions.length) {
    return {
      type: 'info',
      message: '当前是空白卷子，请先添加题型并把总分配置到 100 分。'
    };
  }
  return {
    type: 'success',
    message: '请在编辑卷子顶部操作区里保存当前配置。'
  };
});

async function syncEditingPaper() {
  const paperId = typeof route.query.id === 'string' ? route.query.id : '';
  if (paperId) {
    const loaded = await loadPaperForEdit(paperId);
    if (!loaded) {
      window.alert(state.apiError || '该卷子当前不能编辑。');
    }
  } else {
    createNewPaper();
  }
}

onMounted(syncEditingPaper);
watch(() => route.query.id, () => {
  syncEditingPaper();
});

function patchQuestion(question, patch) {
  Object.assign(question, patch);
}

function addMatchPair(question) {
  question.pairs = question.pairs || [];
  question.pairs.push({
    id: uid('pair'),
    imageUrl: '',
    word: ''
  });
}

function removeMatchPair(question, pairId) {
  question.pairs = (question.pairs || []).filter((pair) => pair.id !== pairId);
}

function addRewardItem() {
  state.editingPaper.rewardConfig.items = state.editingPaper.rewardConfig.items || [];
  state.editingPaper.rewardConfig.items.push({
    id: uid('reward'),
    name: '',
    probability: 10,
    imageUrl: '',
    description: ''
  });
}

function removeRewardItem(itemId) {
  state.editingPaper.rewardConfig.items = (state.editingPaper.rewardConfig.items || []).filter((item) => item.id !== itemId);
}

function addCommentBand() {
  if (!state.editingPaper.commentConfig) {
    state.editingPaper.commentConfig = createDefaultReportCommentConfig();
  }
  state.editingPaper.commentConfig.bands = state.editingPaper.commentConfig.bands || [];
  state.editingPaper.commentConfig.bands.push({
    id: uid('comment'),
    minScore: 60,
    text: ''
  });
}

function removeCommentBand(itemId) {
  state.editingPaper.commentConfig.bands = (state.editingPaper.commentConfig.bands || []).filter((item) => item.id !== itemId);
}

function questionAbilityLabel(question) {
  const labels = Array.isArray(question.abilities) && question.abilities.length
    ? question.abilities
    : getDefaultAbilitiesForType(question.type);
  return labels.length ? `${labels.join(' / ')}能力` : '未配置能力';
}

function questionDifficultyLabel(question) {
  return getQuestionDifficultyLabel(question.difficulty);
}

function handleAbilityChange(question, values) {
  question.abilities = Array.isArray(values) ? values.slice(0, 2) : [];
}
</script>
