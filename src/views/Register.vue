<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">馃摑 娉ㄥ唽</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">鐢ㄦ埛鍚?/label>
          <input v-model="username" class="form-input" placeholder="璇疯缃敤鎴峰悕" required />
        </div>
        <div class="form-group">
          <label class="form-label">鏄电О</label>
          <input v-model="nickname" class="form-input" placeholder="璇疯缃樀绉帮紙鍙€夛級" />
        </div>
        <div class="form-group">
          <label class="form-label">瀵嗙爜</label>
          <input v-model="password" class="form-input" type="password" placeholder="璇疯缃瘑鐮? required minlength="4" />
        </div>
        <div class="form-group">
          <label class="form-label">纭瀵嗙爜</label>
          <input v-model="confirmPassword" class="form-input" type="password" placeholder="璇峰啀娆¤緭鍏ュ瘑鐮? required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? '娉ㄥ唽涓?..' : '娉ㄥ唽' }}
        </button>
      </form>
      <div v-if="error" style="color: var(--danger); font-size: 14px; margin-top: 12px; text-align: center;">
        {{ error }}
      </div>
      <div class="auth-footer">
        宸叉湁璐﹀彿锛?router-link to="/login">绔嬪嵆鐧诲綍</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { register } from '@/utils/auth';

const router = useRouter();
const appStore = useAppStore();
const username = ref('');
const nickname = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  if (password.value !== confirmPassword.value) {
    error.value = '涓ゆ瀵嗙爜涓嶄竴鑷?;
    return;
  }
  if (password.value.length < 4) {
    error.value = '瀵嗙爜鑷冲皯4浣?;
    return;
  }
  loading.value = true;
  try {
    const user = await register(username.value, password.value, nickname.value);
    appStore.setUser(user);
    router.push('/');
  } catch (e) {
    error.value = e.message;
  }
  loading.value = false;
}
</script>
