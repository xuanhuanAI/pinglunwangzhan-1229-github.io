<template>
  <div v-if="job" class="detail-page">
    <div class="detail-header">
      <router-link :to="'/' + type" class="detail-back">← 返回{{ typeLabel }}列表</router-link>
      <h1 class="detail-title">{{ job.title }}</h1>
      <div class="detail-company"><span>🏢</span> {{ job.company }} <span class="badge" :class="'badge-'+type">{{ typeLabel }}</span></div>
      <div class="detail-meta"><span>👤 发布者: {{ job.author }}</span><span>📅 {{ formatTime(job.createdAt) }}</span><span v-if="job.salary">💰 {{ job.salary }}</span></div>
    </div>
    <div class="detail-content">{{ job.description }}</div>
    <div v-if="canDelete" style="display:flex;gap:8px;margin-bottom:24px">
      <button class="btn btn-danger btn-sm" @click="deleteJob">🗑️ 删除此信息</button>
    </div>
    <CommentSection :job-id="job.id" />
  </div>
  <div v-else-if="loading" class="loading"><div class="spinner"></div><p>加载中...</p></div>
  <div v-else class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">信息不存在或已被删除</div></div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import CommentSection from "@/components/CommentSection.vue";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const type = ref(route.params.type);
const job = ref(null);
const loading = ref(true);

const typeLabels = { good: "推荐", medium: "一般", bad: "避雷" };
const typeLabel = computed(() => typeLabels[type.value] || type.value);

const canDelete = computed(() => appStore.isLoggedIn && job.value && (appStore.isAdmin || job.value.authorId === appStore.currentUser?.username));

async function loadJob() {
  loading.value = true;
  job.value = null;

  // 等待数据加载完成
  await appStore.ensureDataLoaded();

  // 从 store 中查找当前工作
  const jobs = appStore.jobs[type.value] || [];
  const found = jobs.find((j) => j.id === route.params.id);
  if (found) {
    job.value = found;
  } else {
    // 数据加载完后如果还没找到，可能是 COS 数据还没完全同步
    // 尝试再等一次重新读取
    await new Promise((r) => setTimeout(r, 500));
    const jobs2 = appStore.jobs[type.value] || [];
    const found2 = jobs2.find((j) => j.id === route.params.id);
    if (found2) {
      job.value = found2;
    }
  }

  loading.value = false;
}

onMounted(loadJob);

// 当路由参数变化时重新加载
watch(() => route.params.id, loadJob);

// 当 job 数据就绪后，如果当前还没找到，自动重试一次
watch(
  () => appStore.jobs[type.value],
  (newJobs) => {
    if (!job.value && !loading.value && newJobs) {
      const found = newJobs.find((j) => j.id === route.params.id);
      if (found) job.value = found;
    }
  },
  { deep: true }
);

async function deleteJob() {
  if (confirm("确定删除此信息吗？")) {
    await appStore.deleteJob(type.value, job.value.id);
    router.push("/" + type.value);
  }
}

function formatTime(t) {
  if (!t) return "";
  return new Date(t).toLocaleString("zh-CN");
}
</script>
