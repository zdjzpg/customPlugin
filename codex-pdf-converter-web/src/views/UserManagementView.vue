<template>
  <div class="admin-page">
    <section class="admin-kpis">
      <article class="admin-kpi">
        <span class="admin-kpi-label">账号总数</span>
        <strong class="admin-kpi-value">{{ state.users.length }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">启用账号</span>
        <strong class="admin-kpi-value">{{ activeUsers }}</strong>
      </article>
      <article class="admin-kpi">
        <span class="admin-kpi-label">管理员</span>
        <strong class="admin-kpi-value">{{ adminUsers }}</strong>
      </article>
    </section>

    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>员工列表</h2>
        </div>
        <a-space>
          <a-button @click="reloadUsers">刷新员工列表</a-button>
          <a-button type="primary" @click="router.push({ name: 'users-new' })">新增员工</a-button>
        </a-space>
      </div>

      <a-table
        class="admin-ant-table"
        :columns="columns"
        :data-source="state.users"
        :pagination="false"
        :row-key="(record) => record.id"
        :scroll="{ x: 840 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username'">
            <div class="admin-row-title static">{{ record.username }}</div>
            <div class="admin-row-note">老师端登录账号</div>
          </template>

          <template v-else-if="column.key === 'role'">
            <a-tag :color="record.role === 'ADMIN' ? 'blue' : 'default'">
              {{ record.role === 'ADMIN' ? '管理员' : '员工' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'ACTIVE' ? 'green' : 'red'">
              {{ record.status === 'ACTIVE' ? '启用中' : '已禁用' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="resetPassword(record)">重置密码</a-button>
              <a-button
                type="primary"
                size="small"
                :disabled="record.username === 'admin'"
                @click="toggleStatus(record)"
              >
                {{ record.status === 'ACTIVE' ? '禁用' : '启用' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </section>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const { state, fetchUsers, resetUserPassword, updateUserStatus } = useExamStore();

const activeUsers = computed(() => state.users.filter((user) => user.status === 'ACTIVE').length);
const adminUsers = computed(() => state.users.filter((user) => user.role === 'ADMIN').length);
const columns = [
  { title: '账号', key: 'username', width: 220 },
  { title: '角色', key: 'role', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', align: 'right', width: 180 }
];

onMounted(async () => {
  try {
    await fetchUsers();
  } catch (error) {
    // store has already captured the user-facing error message
  }
});

async function reloadUsers() {
  try {
    await fetchUsers();
  } catch (error) {
    // store has already captured the user-facing error message
  }
}

async function resetPassword(user) {
  const password = window.prompt(`请输入 ${user.username} 的新密码`, '123456');
  if (!password) {
    return;
  }
  try {
    await resetUserPassword(user.id, password);
    message.success('密码已重置');
  } catch (error) {
    // store has already captured the user-facing error message
  }
}

async function toggleStatus(user) {
  try {
    await updateUserStatus(user.id, user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
    message.success(`账号已${user.status === 'ACTIVE' ? '禁用' : '启用'}`);
  } catch (error) {
    // store has already captured the user-facing error message
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}
</script>
