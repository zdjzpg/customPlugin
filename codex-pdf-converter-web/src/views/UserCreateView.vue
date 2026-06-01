<template>
  <div class="admin-page">
    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <h2>新增员工</h2>
        </div>
        <a-space>
          <a-button @click="router.push({ name: 'users' })">返回员工列表</a-button>
          <a-button @click="resetForm">重置</a-button>
          <a-button
            type="primary"
            :disabled="!form.username.trim() || !form.password.trim()"
            @click="submit"
          >
            创建账号
          </a-button>
        </a-space>
      </div>

      <a-form layout="vertical" class="admin-ant-form admin-create-form" @finish="submit">
        <div class="admin-filters admin-form-grid">
          <a-form-item label="账号">
            <a-input v-model:value="form.username" autocomplete="off" placeholder="例如：staff01" />
          </a-form-item>
          <a-form-item label="密码">
            <a-input-password v-model:value="form.password" autocomplete="new-password" placeholder="初始密码" />
          </a-form-item>
          <a-form-item label="角色">
            <a-select v-model:value="form.role" :options="roleOptions" />
          </a-form-item>
        </div>
      </a-form>
    </section>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const { createUser } = useExamStore();
const form = reactive({ username: '', password: '', role: 'STAFF' });

const roleOptions = [
  { label: '员工', value: 'STAFF' },
  { label: '管理员', value: 'ADMIN' }
];

async function submit() {
  try {
    await createUser({ ...form });
    message.success('账号已创建');
    router.push({ name: 'users' });
  } catch (error) {
    // store has already captured the user-facing error message
  }
}

function resetForm() {
  form.username = '';
  form.password = '';
  form.role = 'STAFF';
}
</script>
