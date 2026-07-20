<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">馃攼 鐧诲綍</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">鐢ㄦ埛鍚?/label>
          <input v-model="username" class="form-input" placeholder="璇疯緭鍏ョ敤鎴峰悕" required />
        </div>
        <div class="form-group">
          <label class="form-label">瀵嗙爜</label>
          <input v-model="password" class="form-input" type="password" placeholder="璇疯緭鍏ュ瘑鐮? required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? '鐧诲綍涓?..' : '鐧诲綍' }}
        </button>
      </form>
      <div v-if="error" style="color: var(--danger); font-size: 14px; margin-top: 12px; text-align: center;">
        {{ error }}
      </div>
      <div class="auth-footer">
        杩樻病鏈夎处鍙凤紵<router-link to="/register">绔嬪嵆娉ㄥ唽</router-link>
      </div>
      <div style="margin-top: 12px; padding: 8px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: var(--text-secondary); text-align: center;">
        绠＄悊鍛? admin / admin123
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { login } from '@/utils/auth';

const router = useRouter();
const appStore = useAppStore();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    const user = await login(username.value, password.value);
    if (user) {
      appStore.setUser(user);
      router.push('/');
    } else {
      error.value = '鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒';
    }
  } catch (e) {
    error.value = '鐧诲綍澶辫触: ' + e.message;
  }
  loading.value = false;
}
</script>
