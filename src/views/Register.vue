<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">📝 实名注册</h2>
      <form @submit.prevent="handleRegister">
        <!-- 真实姓名 -->
        <div class="form-group">
          <label class="form-label">真实姓名 *</label>
          <input v-model="realName" class="form-input" placeholder="输入真实姓名（用于实名认证）" required @input="nameChecked=false" />
          <div v-if="nameCheckMsg" style="margin-top:4px;font-size:12px;color:var(--danger)">{{ nameCheckMsg }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">身份证号 *</label>
          <input v-model="idNumber" class="form-input" placeholder="输入18位身份证号（用于实名认证）" required maxlength="18" />
          <div v-if="idError" style="margin-top:4px;font-size:12px;color:var(--danger)">{{ idError }}</div>
        </div>
        <!-- 手机号 -->
        <div class="form-group">
          <label class="form-label">手机号 *</label>
          <input v-model="phone" class="form-input" placeholder="输入手机号" required maxlength="11" @input="phoneChecked=false;smsSent=false" />
          <div v-if="phoneError" style="margin-top:4px;font-size:12px;color:var(--danger)">{{ phoneError }}</div>
        </div>
        <!-- 短信验证码 -->
        <div class="form-group" style="display:flex;gap:8px;align-items:flex-end">
          <div style="flex:1">
            <label class="form-label">短信验证码 *</label>
            <input v-model="smsCode" class="form-input" placeholder="输入6位验证码" maxlength="6" required />
          </div>
          <button type="button" class="btn btn-sm" :class="smsSent?'btn-outline':'btn-primary'" @click="sendSMSCode" :disabled="smsSending||countdown>0" style="white-space:nowrap;height:40px">
            {{ smsSending ? '发送中...' : countdown > 0 ? countdown+'s' : smsSent ? '重新获取' : '获取验证码' }}
          </button>
        </div>
        <div v-if="smsError" style="margin-top:4px;font-size:12px;color:var(--danger);margin-bottom:8px">{{ smsError }}</div>
        <div v-if="smsSent" style="font-size:12px;color:var(--success);margin-bottom:4px;background:#f0fdf4;padding:6px 10px;border-radius:6px;border:1px solid #6ee7b7">✅ [模拟] 验证码 <strong style="font-size:16px;letter-spacing:2px">{{ realCode }}</strong>（有效期5分钟，60秒后可重新获取）</div>
        <!-- 用户名 -->
        <div class="form-group">
          <label class="form-label">用户名 *</label>
          <input v-model="username" class="form-input" placeholder="设置用户名（唯一）" required />
        </div>
        <!-- 昵称 -->
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input v-model="nickname" class="form-input" placeholder="昵称（可选）" />
        </div>
        <!-- 密码 -->
        <div class="form-group">
          <label class="form-label">密码 *</label>
          <input v-model="password" class="form-input" type="password" placeholder="至少8位，包含大小写字母+数字+特殊字符" required @input="checkPwd" />
          <div v-if="pwdLevel" style="margin-top:4px">
            <div style="display:flex;gap:4px;align-items:center">
              <div v-for="i in 5" :key="i" style="width:18%;height:4px;border-radius:2px;background: i <= pwdScore ? (pwdScore<=2?'var(--danger)':pwdScore<=3?'var(--warning)':'var(--success)') : '#e5e7eb'"></div>
              <span style="font-size:11px;margin-left:4px;color:var(--text-secondary)">{{ pwdLevel }} ({{ pwdScore }}/5)</span>
            </div>
            <div v-if="pwdErrors.length" style="font-size:11px;color:var(--danger);margin-top:2px">{{ pwdErrors.join("、") }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">确认密码 *</label>
          <input v-model="confirmPassword" class="form-input" type="password" placeholder="再次输入密码" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%" :disabled="loading">
          {{ loading ? "注册中..." : "实名注册" }}
        </button>
      </form>
      <div v-if="aiChecking" style="text-align:center;margin-top:12px;font-size:13px;color:var(--primary)">🤖 AI实名校验
    const nr = await validateRealName(realName.value, idNumber.value);
    if (!nr.valid) { error.value = "AI实名认证未通过: " + (nr.reason || "姓名不合法"); aiChecking.value = false; return; }
  } catch (e) { console.warn("AI校验失败:", e.message); }
  aiChecking.value = false;

  loading.value = true;
  try {
    const user = await register(username.value, password.value, nickname.value, realName.value, p.phone);
    appStore.setUser(user);
    router.push("/");
  } catch (e) { error.value = e.message; }
  loading.value = false;
}
</script>






