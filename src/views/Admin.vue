<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><span>鈿欙笍</span> 绠＄悊鍚庡彴</h1>
    </div>

    <div class="admin-layout">
      <div class="admin-sidebar">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="admin-sidebar-item"
          :class="{ active: currentTab === item.key }"
          @click="currentTab = item.key"
        >
          <span>{{ item.icon }}</span> {{ item.label }}
        </div>
      </div>

      <div class="admin-content">
        <!-- 姒傝 -->
        <div v-if="currentTab === 'overview'">
          <h3 style="margin-bottom: 16px;">馃搳 绔欑偣姒傝</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 8px;">馃憤</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--success);">{{ appStore.jobs.good.length }}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">濂藉伐浣滄帹鑽?/div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 8px;">馃憣</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--warning);">{{ appStore.jobs.medium.length }}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">涓瓑宸ヤ綔</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 8px;">鈿狅笍</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--danger);">{{ appStore.jobs.bad.length }}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">閬块浄淇℃伅</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 8px;">馃挰</div>
              <div style="font-size: 28px; font-weight: 700;">{{ appStore.comments.length }}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">璇勮鎬绘暟</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 8px;">馃懃</div>
              <div style="font-size: 28px; font-weight: 700;">{{ users.length }}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">娉ㄥ唽鐢ㄦ埛</div>
            </div>
          </div>
        </div>

        <!-- 鍐呭绠＄悊 -->
        <div v-if="currentTab === 'content'">
          <h3 style="margin-bottom: 16px;">馃搵 鍐呭绠＄悊</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            <button class="btn btn-sm" :class="contentFilter === 'all' ? 'btn-primary' : 'btn-outline'" @click="contentFilter = 'all'">鍏ㄩ儴</button>
            <button class="btn btn-sm" :class="contentFilter === 'good' ? 'btn-success' : 'btn-outline'" @click="contentFilter = 'good'">濂藉伐浣?/button>
            <button class="btn btn-sm" :class="contentFilter === 'medium' ? 'btn-warning' : 'btn-outline'" @click="contentFilter = 'medium'">涓瓑</button>
            <button class="btn btn-sm" :class="contentFilter === 'bad' ? 'btn-danger' : 'btn-outline'" @click="contentFilter = 'bad'">閬块浄</button>
          </div>

          <div v-for="item in filteredContent" :key="item.id + item.type" class="job-card" :class="'job-card-' + item.type" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong>{{ item.title }}</strong>
                <span style="font-size: 12px; color: var(--text-secondary); margin-left: 8px;">@ {{ item.company }}</span>
                <span class="badge" :class="'badge-' + item.type" style="margin-left: 8px;">{{ typeLabels[item.type] }}</span>
              </div>
              <button class="btn btn-danger btn-sm" @click="deleteContent(item)">鍒犻櫎</button>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              浣滆€? {{ item.author }} | {{ formatTime(item.createdAt) }}
            </div>
          </div>
          <div v-if="filteredContent.length === 0" class="empty-state" style="padding: 30px;">
            <div class="empty-state-icon">馃摥</div>
            <div class="empty-state-text">鏆傛棤鍐呭</div>
          </div>
        </div>

        <!-- 璇勮绠＄悊 -->
        <div v-if="currentTab === 'comments'">
          <h3 style="margin-bottom: 16px;">馃挰 璇勮绠＄悊</h3>
          <div v-for="comment in appStore.comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <div class="comment-author">
                <span>馃懁</span> {{ comment.author }}
                <span class="badge badge-admin" style="font-size: 10px;" v-if="comment.isAdmin">绠＄悊鍛?/span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                <button class="btn btn-danger btn-sm" @click="deleteComment(comment.id)">鍒犻櫎</button>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
          <div v-if="appStore.comments.length === 0" class="empty-state" style="padding: 30px;">
            <div class="empty-state-icon">馃摥</div>
            <div class="empty-state-text">鏆傛棤璇勮</div>
          </div>
        </div>

        <!-- 鐢ㄦ埛绠＄悊 -->
        <div v-if="currentTab === 'users'">
          <h3 style="margin-bottom: 16px;">馃懃 鐢ㄦ埛绠＄悊</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f9fafb; text-align: left;">
                  <th style="padding: 10px 12px; border-bottom: 2px solid var(--border);">鐢ㄦ埛鍚?/th>
                  <th style="padding: 10px 12px; border-bottom: 2px solid var(--border);">鏄电О</th>
                  <th style="padding: 10px 12px; border-bottom: 2px solid var(--border);">瑙掕壊</th>
                  <th style="padding: 10px 12px; border-bottom: 2px solid var(--border);">娉ㄥ唽鏃堕棿</th>
                  <th style="padding: 10px 12px; border-bottom: 2px solid var(--border);">鎿嶄綔</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.username" style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 10px 12px;">{{ u.username }}</td>
                  <td style="padding: 10px 12px;">{{ u.nickname || '-' }}</td>
                  <td style="padding: 10px 12px;">
                    <span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">
                      {{ u.role === 'admin' ? '绠＄悊鍛? : '鐢ㄦ埛' }}
                    </span>
                  </td>
                  <td style="padding: 10px 12px; color: var(--text-secondary); font-size: 12px;">
                    {{ u.createdAt ? formatTime(u.createdAt) : '-' }}
                  </td>
                  <td style="padding: 10px 12px;">
                    <button
                      v-if="u.role !== 'admin'"
                      class="btn btn-danger btn-sm"
                      @click="deleteUser(u.username)"
                    >
                      鍒犻櫎
                    </button>
                    <span v-else style="font-size: 12px; color: var(--text-secondary);">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- COS閰嶇疆 -->
        <div v-if="currentTab === 'cos'">
          <h3 style="margin-bottom: 16px;">鈽侊笍 鑵捐浜慍OS閰嶇疆</h3>
          <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #92400e;">
            鈿狅笍 璇峰厛鍦ㄨ吘璁簯鎺у埗鍙拌幏鍙?SecretId 鍜?SecretKey锛屽苟鍒涘缓涓€涓瓨鍌ㄦ《銆?
          </div>
          <form @submit.prevent="saveCOSConfig">
            <div class="form-group">
              <label class="form-label">SecretId</label>
              <input v-model="cosConfig.SecretId" class="form-input" placeholder="璇疯緭鍏ecretId" />
            </div>
            <div class="form-group">
              <label class="form-label">SecretKey</label>
              <input v-model="cosConfig.SecretKey" class="form-input" type="password" placeholder="璇疯緭鍏ecretKey" />
            </div>
            <div class="form-group">
              <label class="form-label">瀛樺偍妗跺悕绉?(Bucket)</label>
              <input v-model="cosConfig.Bucket" class="form-input" placeholder="渚嬪锛歽our-bucket-1250000000" />
            </div>
            <div class="form-group">
              <label class="form-label">鎵€灞炲湴鍩?(Region)</label>
              <select v-model="cosConfig.Region" class="form-select">
                <option value="ap-guangzhou">骞垮窞 (ap-guangzhou)</option>
                <option value="ap-shanghai">涓婃捣 (ap-shanghai)</option>
                <option value="ap-beijing">鍖椾含 (ap-beijing)</option>
                <option value="ap-shenzhen-fsi">娣卞湷閲戣瀺 (ap-shenzhen-fsi)</option>
                <option value="ap-hongkong">棣欐腐 (ap-hongkong)</option>
                <option value="ap-singapore">鏂板姞鍧?(ap-singapore)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">淇濆瓨骞跺垵濮嬪寲COS</button>
          </form>
          <div v-if="cosStatus" style="margin-top: 12px; padding: 8px 12px; border-radius: 8px; font-size: 14px; background: var(--success); color: white;">
            {{ cosStatus }}
          </div>
        </div>

        <!-- 绔欑偣璁剧疆 -->
        <div v-if="currentTab === 'settings'">
          <h3 style="margin-bottom: 16px;">馃帹 绔欑偣璁剧疆</h3>
          <form @submit.prevent="saveSettings">
            <div class="form-group">
              <label class="form-label">缃戠珯鑳屾櫙鍥剧墖URL</label>
              <input v-model="appStore.siteConfig.backgroundImage" class="form-input" placeholder="杈撳叆鑳屾櫙鍥剧墖URL锛岀暀绌轰娇鐢ㄩ粯璁よ儗鏅? />
            </div>
            <div style="margin-bottom: 16px;">
              <label class="form-label">鑳屾櫙棰勮</label>
              <div style="border: 2px dashed var(--border); border-radius: 8px; height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f9fafb;">
                <img v-if="appStore.siteConfig.backgroundImage" :src="appStore.siteConfig.backgroundImage" style="max-width: 100%; max-height: 100%; object-fit: cover;" />
                <span v-else style="color: var(--text-secondary); font-size: 14px;">鏆傛棤鑳屾櫙鍥?/span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">涓婚鑹?/label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input v-model="appStore.siteConfig.primaryColor" class="form-input" style="width: 120px;" placeholder="#4f46e5" />
                <input type="color" v-model="appStore.siteConfig.primaryColor" style="width: 40px; height: 40px; border: none; cursor: pointer; border-radius: 4px;" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary">淇濆瓨璁剧疆</button>
          </form>
          <div v-if="settingsStatus" style="margin-top: 12px; padding: 8px 12px; border-radius: 8px; font-size: 14px; background: var(--success); color: white;">
            {{ settingsStatus }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { getCOSConfig, initCOS, loadSavedConfig } from "@/utils/cos";
import { getAllUsers, deleteUser as deleteUserApi } from '@/utils/auth';

const appStore = useAppStore();
const currentTab = ref('overview');
const contentFilter = ref('all');
const cosStatus = ref('');
const settingsStatus = ref('');
const users = ref([]);
const savedConfig = loadSavedConfig();
const cosConfig = ref({
    SecretId: savedConfig?.SecretId || '',
  SecretKey: savedConfig?.SecretKey || '',
  Bucket: savedConfig?.Bucket || getCOSConfig().Bucket,
  Region: savedConfig?.Region || getCOSConfig().Region,
});

const typeLabels = { good: '鎺ㄨ崘', medium: '涓€鑸?, bad: '閬块浄' };

const menuItems = [
  { key: 'overview', icon: '馃搳', label: '姒傝' },
  { key: 'content', icon: '馃搵', label: '鍐呭绠＄悊' },
  { key: 'comments', icon: '馃挰', label: '璇勮绠＄悊' },
  { key: 'users', icon: '馃懃', label: '鐢ㄦ埛绠＄悊' },
  { key: 'cos', icon: '鈽侊笍', label: 'COS閰嶇疆' },
  { key: 'settings', icon: '馃帹', label: '绔欑偣璁剧疆' },
];

const filteredContent = computed(() => {
  const all = [];
  for (const type of ['good', 'medium', 'bad']) {
    if (contentFilter.value === 'all' || contentFilter.value === type) {
      for (const job of appStore.jobs[type]) {
        all.push({ ...job, type });
      }
    }
  }
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

onMounted(async () => {
  users.value = await getAllUsers();
});

async function deleteContent(item) {
  if ($`纭畾鍒犻櫎銆?{item.title}銆嶅悧锛焋) {
    await appStore.deleteJob(item.type, item.id);
  }
}

async function deleteComment(id) {
  if (confirm('纭畾鍒犻櫎姝よ瘎璁哄悧锛?)) {
    await appStore.deleteComment(id);
  }
}

async function deleteUser(username) {
  if ($`纭畾鍒犻櫎鐢ㄦ埛銆?{username}銆嶅悧锛焋) {
    await deleteUserApi(username);
    users.value = await getAllUsers();
  }
}

async function saveCOSConfig() {
  try {
    await initCOS(cosConfig.value);
    cosStatus.value = 'COS閰嶇疆宸蹭繚瀛橈紝杩炴帴鎴愬姛锛?;
  } catch (e) {
    cosStatus.value = '閰嶇疆宸蹭繚瀛橈紝浣嗚繛鎺ユ祴璇曞け璐ワ細' + e.message + '锛堝彲绋嶅悗閲嶈瘯锛?;
  }
}

async function saveSettings() {
  await appStore.saveSiteConfig();
  settingsStatus.value = '璁剧疆宸蹭繚瀛橈紒';
}
</script>
