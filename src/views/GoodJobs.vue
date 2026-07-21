<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><span>👍</span> 好工作推荐</h1>
      <button v-if="appStore.isLoggedIn" class="btn btn-success" @click="showForm = true">+ 发布推荐</button>
    </div>

    <div v-if="appStore.loading && appStore.jobs.good.length === 0" class="loading">
      <div class="spinner"></div><p>加载中...</p>
    </div>

    <div v-else-if="appStore.jobs.good.length === 0" class="empty-state">
      <div class="empty-state-icon">🎉</div>
      <div class="empty-state-text">还没有人分享好工作，来做第一个推荐人吧！</div>
      <button v-if="appStore.isLoggedIn" class="btn btn-success" style="margin-top:12px" @click="showForm = true">发布推荐</button>
      <router-link v-else to="/login" class="btn btn-primary" style="margin-top:12px">登录后发布</router-link>
    </div>

    <div v-else class="job-list">
      <JobCard v-for="job in appStore.jobs.good" :key="job.id" :job="job" type="good" />
    </div>

    <!-- 发布表单弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <div class="modal-title">
          <span>👍 推荐好工作</span>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <form @submit.prevent="submitJob">
          <div class="form-group">
            <label class="form-label">岗位名称 *</label>
            <input v-model="form.title" class="form-input" placeholder="例如：前端开发工程师" required />
          </div>
          <div class="form-group" style="position:relative">
            <label class="form-label">公司名称 *</label>
            <input v-model="form.company" class="form-input" placeholder="输入公司名称搜索" required @input="onCompanyInput" @focus="showSuggestions = true" @blur="hideSuggestionsDelayed" />
            <div v-if="showSuggestions && filteredCompanies.length > 0" style="position:absolute;top:100%;left:0;right:0;background:white;border:1px solid var(--border);border-radius:8px;z-index:100;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              <div v-for="c in filteredCompanies" :key="c.name" style="padding:8px 12px;cursor:pointer;font-size:14px" @mousedown.prevent="selectCompany(c.name)" @mouseover="hoverIdx = filteredCompanies.indexOf(c)" :class="{active: hoverIdx === filteredCompanies.indexOf(c)}" :style="{background: hoverIdx === filteredCompanies.indexOf(c) ? '#eef2ff' : ''}">{{ c.name }}</div>
            </div>
            <div v-if="companyCheck && !companyCheck.valid && form.company" style="margin-top:4px;font-size:12px;color:var(--danger)">{{ companyCheck.message }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">推荐理由 *</label>
            <textarea v-model="form.description" class="form-textarea" placeholder="分享你的真实工作体验、薪资待遇、团队氛围等..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">薪资范围</label>
            <input v-model="form.salary" class="form-input" placeholder="例如：15K-25K / 年薪30W+" />
          </div>
          <div v-if="publishError" style="color:var(--danger);font-size:13px;margin-bottom:8px">{{ publishError }}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" class="btn btn-outline" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-success" :disabled="publishing">{{ publishing ? '发布中...' : '发布推荐' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="toastMsg" class="toast" :class="toastType" style="position:fixed;top:80px;right:24px;z-index:3000">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import JobCard from '@/components/JobCard.vue';

const appStore = useAppStore();
const showForm = ref(false);
const publishing = ref(false);
const publishError = ref("");
const toastMsg = ref("");
const toastType = ref("toast-success");
const showSuggestions = ref(false);
const hoverIdx = ref(-1);
const form = ref({ title: '', company: '', description: '', salary: '' });

onMounted(() => { appStore.ensureDataLoaded(); });

const filteredCompanies = computed(() => {
  const q = (form.value.company || "").trim().toLowerCase();
  if (!q) return appStore.companies.slice(0, 10);
  return appStore.companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
});

const companyCheck = computed(() => {
  if (!form.value.company || !form.value.company.trim()) return null;
  return appStore.validateCompany(form.value.company);
});

function onCompanyInput() {
  showSuggestions.value = true;
  hoverIdx.value = -1;
}

function selectCompany(name) {
  form.value.company = name;
  showSuggestions.value = false;
}

function hideSuggestionsDelayed() {
  setTimeout(() => { showSuggestions.value = false; }, 200);
}

function showToast(msg, type) { toastMsg.value = msg; toastType.value = type; setTimeout(() => { toastMsg.value = ""; }, 3000); }

async function submitJob() {
  // 校验公司
  const check = appStore.validateCompany(form.value.company);
  if (!check.valid) {
    publishError.value = check.message;
    return;
  }
  publishing.value = true;
  publishError.value = "";
  try {
    await appStore.addJob('good', {
      title: form.value.title,
      company: form.value.company,
      description: form.value.description,
      salary: form.value.salary,
      author: appStore.currentUser.nickname || appStore.currentUser.username,
      authorId: appStore.currentUser.username,
    });
    form.value = { title: '', company: '', description: '', salary: '' };
    showForm.value = false;
    showToast("✅ 发布成功！");
  } catch (e) {
    publishError.value = "发布失败: " + e.message;
    showToast("❌ 发布失败", "toast-error");
  }
  publishing.value = false;
}
</script>
