<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">📝 实名注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">真实姓名 *</label>
          <input v-model="realName" class="form-input" placeholder="输入真实姓名（用于实名认证）" required />
        </div>
        <div class="form-group">
          <label class="form-label">身份证号 *</label>
          <input v-model="idNumber" class="form-input" placeholder="输入18位身份证号（用于实名认证）" required maxlength="18" />
        </div>
        <div class="form-group">
          <label class="form-label">手机号 *</label>
          <input v-model="phone" class="form-input" placeholder="输入手机号" required maxlength="11" @input="smsSent=false" />
        </div>
        <div class="form-group" style="display:flex;gap:8px;align-items:flex-end">
          <div style="flex:1">
            <label class="form-label">短信验证码 *</label>
            <input v-model="smsCode" class="form-input" placeholder="输入6位验证码" maxlength="6" required />
          </div>
          <button type="button" class="btn btn-sm" :class="smsSent?&apos;btn-outline&apos;:&apos;btn-primary&apos;" @click="sendSMSCode" :disabled="smsSending||countdown>0" style="white-space:nowrap;height:40px">
            {{ smsSending ? "发送中..." : countdown > 0 ? countdown+"s" : smsSent ? "重新获取" : "获取验证码" }}
          </button>
        </div>
        <div v-if="smsError" style="margin-top:4px;font-size:12px;color:var(--danger);margin-bottom:8px">{{ smsError }}</div>
        <div v-if="smsSent" style="font-size:12px;color:var(--success);margin-bottom:4px;background:#f0fdf4;padding:6px 10px;border-radius:6px;border:1px solid #6ee7b7">✅ [模拟] 验证码 <strong style="font-size:16px;letter-spacing:2px">{{ realCode }}</strong>（5分钟有效）</div>
        <div class="form-group">
          <label class="form-label">用户名 *</label>
          <input v-model="username" class="form-input" placeholder="设置用户名（唯一）" required />
        </div>
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input v-model="nickname" class="form-input" placeholder="昵称（可选）" />
        </div>
        <div class="form-group">
          <label class="form-label">密码 *</label>
          <input v-model="password" class="form-input" type="password" placeholder="至少8位，含大小写+数字+特殊字符" required @input="checkPwd" />
          <div v-if="pwdLevel" style="margin-top:4px">
            <div style="display:flex;gap:4px;align-items:center">
              <div v-for="i in 5" :key="i" :style="barStyle(i)" style="width:18%;height:4px;border-radius:2px"></div>
              <span style="font-size:11px;margin-left:4px;color:var(--text-secondary)">{{ pwdLevel }} ({{ pwdScore }}/5)</span>
            </div>
            <div v-if="pwdErrors.length" style="font-size:11px;color:var(--danger);margin-top:2px">{{ pwdErrors.join("、") }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">确认密码 *</label>
          <input v-model="confirmPassword" class="form-input" type="password" placeholder="再次输入密码" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%" :disabled="loading || aiChecking">
          {{ loading ? (aiChecking ? "AI实名认证中..." : "注册中...") : "实名注册" }}
        </button>
      </form>
      <div v-if="error" style="color:var(--danger);font-size:14px;margin-top:12px;text-align:center">{{ error }}</div>
      <div class="auth-footer">已有账号？<router-link to="/login">立即登录</router-link></div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { register } from "@/utils/auth";
import { validateRealName, validatePhone, generateSMSCode, validatePasswordStrength } from "@/utils/ai";

const router = useRouter();
const appStore = useAppStore();

const username = ref("");
const nickname = ref("");
const password = ref("");
const confirmPassword = ref("");
const realName = ref("");
const idNumber = ref("");
const phone = ref("");
const smsCode = ref("");

const error = ref("");
const loading = ref(false);
const aiChecking = ref(false);

const smsSending = ref(false);
const smsSent = ref(false);
const smsError = ref("");
const realCode = ref("");
const codeExpiresAt = ref(0);
const countdown = ref(0);
let countdownTimer = null;

function startCountdown() {
  countdown.value = 60;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) { clearInterval(countdownTimer); countdownTimer = null; }
  }, 1000);
}

const pwdLevel = ref("");
const pwdScore = ref(0);
const pwdErrors = ref([]);

function checkPwd() {
  const r = validatePasswordStrength(password.value);
  pwdScore.value = r.score;
  pwdLevel.value = r.level;
  pwdErrors.value = r.errors;
}

/** 密码强度条的背景色 */
function barColor(index) {
  if (index > pwdScore.value) return "#e5e7eb";
  if (pwdScore.value <= 2) return "var(--danger)";
  if (pwdScore.value <= 3) return "var(--warning)";
  return "var(--success)";
}
function barStyle(index) {
  return { background: barColor(index) };
}

async function sendSMSCode() {
  const p = validatePhone(phone.value);
  if (!p.valid) { smsError.value = "请输入正确的11位手机号"; return; }
  smsError.value = "";
  smsSending.value = true;
  try {
    const result = await generateSMSCode(p.phone);
    realCode.value = result.code;
    codeExpiresAt.value = result.expiresAt;
    smsSent.value = true;
    startCountdown();
  } catch (e) { smsError.value = "发送失败: " + e.message; }
  smsSending.value = false;
}

async function handleRegister() {
  // 清空错误
  error.value = "";

  // === 第1步：本地格式校验（无需AI，立即反馈） ===
  const nameValid = realName.value && /^[\u4e00-\u9fa5]{2,4}$/.test(realName.value);
  if (!nameValid) { error.value = "姓名必须为2-4个中文汉字"; return; }

  const idValid = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idNumber.value);
  if (!idValid) { error.value = "身份证号格式不正确（18位）"; return; }

  const p = validatePhone(phone.value);
  if (!p.valid) { error.value = "手机号格式不正确"; return; }

  if (!smsSent.value || !smsCode.value) { error.value = "请先获取短信验证码"; return; }
  if (Date.now() > codeExpiresAt.value) { error.value = "验证码已过期，请重新获取"; return; }
  if (smsCode.value !== realCode.value) { error.value = "验证码错误"; return; }

  if (password.value !== confirmPassword.value) { error.value = "两次密码不一致"; return; }

  const pwdR = validatePasswordStrength(password.value);
  if (!pwdR.valid) { error.value = "密码强度不足: " + pwdR.errors.join("、"); return; }

  // === 第2步：AI实名认证（单次调用，带超时） ===
  loading.value = true;
  aiChecking.value = true;

  try {
    const nr = await validateRealName(realName.value, idNumber.value);
    if (!nr || !nr.valid) {
      error.value = "实名认证未通过: " + (nr?.reason || "姓名或身份证号有误");
      loading.value = false;
      aiChecking.value = false;
      return;
    }
  } catch (e) {
    error.value = "AI实名认证失败，请检查网络后重试";
    loading.value = false;
    aiChecking.value = false;
    return;
  }

  aiChecking.value = false;

  // === 第3步：提交注册 ===
  try {
    const user = await register(username.value, password.value, nickname.value, realName.value, p.phone);
    appStore.setUser(user);
    router.push("/");
  } catch (e) {
    error.value = e.message;
  }

  loading.value = false;
}
</script>
