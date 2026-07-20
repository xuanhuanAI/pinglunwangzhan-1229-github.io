<template>
  <div>
    <div class="hero-section">
      <h1 class="hero-title">鑱岃瘎缃?/h1>
      <p class="hero-subtitle">
        鎵惧伐浣滈伩闆锋寚鍗?鈥?鍒嗕韩鐪熷疄宸ヤ綔浣撻獙锛屽府鍔╂眰鑱岃€呭仛鍑烘槑鏅洪€夋嫨
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <router-link to="/good" class="btn btn-primary btn-lg">鏌ョ湅濂藉伐浣滄帹鑽?/router-link>
        <router-link to="/bad" class="btn btn-danger btn-lg">鏌ョ湅閬块浄鍚嶅崟</router-link>
      </div>
    </div>

    <div class="module-grid">
      <router-link to="/good" class="module-card module-card-good">
        <div class="module-icon">馃憤</div>
        <div class="module-name" style="color: #065f46;">濂藉伐浣?/div>
        <div class="module-desc">
          鍒嗕韩浼樿川鍏徃鍜屽矖浣嶏紝鎺ㄨ崘鍊煎緱鍔犲叆鐨勫洟闃?        </div>
        <div class="module-count badge badge-good">
          {{ appStore.jobs.good.length }} 鏉℃帹鑽?        </div>
      </router-link>

      <router-link to="/medium" class="module-card module-card-medium">
        <div class="module-icon">馃憣</div>
        <div class="module-name" style="color: #92400e;">涓瓑宸ヤ綔</div>
        <div class="module-desc">
          涓€鑸埇鐨勫伐浣滐紝浼樼己鐐归兘鏈夛紝鑷鍒ゆ柇
        </div>
        <div class="module-count badge badge-medium">
          {{ appStore.jobs.medium.length }} 鏉¤褰?        </div>
      </router-link>

      <router-link to="/bad" class="module-card module-card-bad">
        <div class="module-icon">鈿狅笍</div>
        <div class="module-name" style="color: #991b1b;">閬块浄宸ヤ綔</div>
        <div class="module-desc">
          韪╁潙缁忛獙鍒嗕韩锛屽府浣犻伩寮€鍧戠埞鍏徃鍜屽矖浣?        </div>
        <div class="module-count badge badge-bad">
          {{ appStore.jobs.bad.length }} 鏉￠伩闆?        </div>
      </router-link>
    </div>

    <!-- 鏈€鏂板姩鎬?-->
    <div style="margin-top: 48px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">馃摙 鏈€鏂板姩鎬?/h2>
      <div class="job-list">
        <div v-for="item in recentJobs" :key="item.id + item.type">
          <JobCard :job="item" :type="item.type" />
        </div>
      </div>
      <div v-if="recentJobs.length === 0" class="empty-state">
        <div class="empty-state-icon">馃搵</div>
        <div class="empty-state-text">杩樻病鏈変换浣曞伐浣滀俊鎭?/div>
        <router-link v-if="appStore.isLoggedIn" to="/good" class="btn btn-primary" style="margin-top: 12px;">
          鍙戝竷绗竴鏉′俊鎭?        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import JobCard from '@/components/JobCard.vue';

const appStore = useAppStore();

const recentJobs = computed(() => {
  const all = [];
  for (const type of ['good', 'medium', 'bad']) {
    for (const job of appStore.jobs[type]) {
      all.push({ ...job, type });
    }
  }
  return all
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
});

onMounted(() => {
  if (appStore.jobs.good.length === 0) {
    appStore.initApp();
  }
});
</script>
