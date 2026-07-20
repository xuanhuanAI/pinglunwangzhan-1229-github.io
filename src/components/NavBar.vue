<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">
      <span class="logo-icon">馃攳</span>
      <span>鑱岃瘎缃?/span>
    </router-link>

    <ul class="navbar-links">
      <li>
        <router-link to="/good" active-class="active">
          <span>馃憤</span> 濂藉伐浣?        </router-link>
      </li>
      <li>
        <router-link to="/medium" active-class="active">
          <span>馃憣</span> 涓瓑宸ヤ綔
        </router-link>
      </li>
      <li>
        <router-link to="/bad" active-class="active">
          <span>鈿狅笍</span> 閬块浄宸ヤ綔
        </router-link>
      </li>
    </ul>

    <div class="navbar-right">
      <template v-if="appStore.isLoggedIn">
        <router-link to="/admin" class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;">
          鈿欙笍 绠＄悊
        </router-link>
        <span style="font-size:14px;margin:0 8px;">
          {{ appStore.currentUser.nickname || appStore.currentUser.username }}
        </span>
        <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;" @click="handleLogout">
          閫€鍑?        </button>
      </template>
      <template v-else>
        <router-link to="/login" class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;">
          鐧诲綍
        </router-link>
        <router-link to="/register" class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;">
          娉ㄥ唽
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const router = useRouter();
const appStore = useAppStore();

function handleLogout() {
  appStore.logout();
  router.push('/');
}
</script>
