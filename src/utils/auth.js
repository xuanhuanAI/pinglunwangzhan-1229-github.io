import { getCOSData, putCOSData } from "./cos";
import { isCOSReady } from "./cos";

export const DEFAULT_ADMIN = {
  username: "admin",
  password: "admin123",
  role: "admin",
  nickname: "管理员",
  phone: "",
  realName: "管理员",
};

const PENDING_USERS_KEY = "pending_users";

function getPendingUsers() {
  try { const d = localStorage.getItem(PENDING_USERS_KEY); return d ? JSON.parse(d) : []; }
  catch { return []; }
}
function savePendingUsers(u) { localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(u)); }

export async function getUsers() {
  let cosUsers = [];
  try { const d = await getCOSData("data/users.json"); cosUsers = d || []; }
  catch (e) { console.warn("COS读用户失败:", e.message); }
  const pending = getPendingUsers();
  // 合并时去重（以 username 为准）
  const all = [...cosUsers];
  for (const pu of pending) {
    if (!all.find(u => u.username === pu.username)) all.push(pu);
  }
  if (!all.find(u => u.username === DEFAULT_ADMIN.username)) all.push(DEFAULT_ADMIN);
  return all;
}

export async function saveUsers(users) {
  if (isCOSReady()) { await putCOSData("data/users.json", users); savePendingUsers([]); }
}

export async function login(username, password) {
  const users = await getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) { const { password: _, ...safe } = user; return safe; }
  return null;
}

/** 手机号 + 验证码登录 */
export async function loginByPhone(phone) {
  const users = await getUsers();
  // 先尝试精确匹配
  let user = users.find(u => u.phone === phone);
  // 再尝试去除空格后匹配
  if (!user) {
    const cleaned = phone.replace(/\s+/g, "");
    user = users.find(u => u.phone === cleaned);
  }
  if (!user) throw new Error("该手机号未注册");
  const { password: _, ...safe } = user;
  return safe;
}

export async function register(username, password, nickname, realName, phone) {
  const users = await getUsers();
  if (users.find(u => u.username === username)) throw new Error("用户名已存在");
  if (phone && users.find(u => u.phone === phone)) throw new Error("该手机号已注册");
  const newUser = {
    username, password,
    nickname: nickname || username,
    realName: realName || "",
    phone: phone || "",
    role: "user",
    createdAt: new Date().toISOString(),
  };

  // 1. 尝试写入 COS（如果有权限）
  if (isCOSReady()) {
    users.push(newUser);
    await putCOSData("data/users.json", users);
  }

  // 2. 无论如何也保存到本地 pending，确保登录时能读到
  const pending = getPendingUsers();
  if (!pending.find(u => u.username === newUser.username)) {
    pending.push(newUser);
    savePendingUsers(pending);
  }

  // 3. 额外保存手机号->用户映射到 localStorage（供登录兜底）
  try {
    localStorage.setItem("phone_user_" + newUser.phone.replace(/\s+/g, ""), JSON.stringify(newUser));
  } catch(e) {}

  const { password: _, ...safe } = newUser;
  return safe;
}

/** 通过手机号重置密码 */
export async function resetPasswordByPhone(phone, newPassword) {
  if (!isCOSReady()) throw new Error("请先由管理员配置COS");
  const users = await getUsers();
  const idx = users.findIndex(u => u.phone === phone);
  if (idx === -1) throw new Error("该手机号未注册");
  users[idx].password = newPassword;
  await putCOSData("data/users.json", users);
}

export async function syncPendingUsers() {
  if (!isCOSReady()) throw new Error("COS 未初始化");
  const pending = getPendingUsers();
  if (pending.length === 0) return 0;
  let cosUsers = [];
  try { const d = await getCOSData("data/users.json"); cosUsers = d || []; } catch {}
  let added = 0;
  for (const pu of pending) {
    if (!cosUsers.find(u => u.username === pu.username)) {
      cosUsers.push(pu);
      added++;
    }
  }
  if (added > 0) await putCOSData("data/users.json", cosUsers);
  savePendingUsers([]);
  return added;
}

export async function getAllUsers() { return await getUsers(); }

export async function updateUserRole(username, newRole) {
  if (!isCOSReady()) throw new Error("COS 未初始化");
  const users = await getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) throw new Error("用户不存在");
  if (users[idx].username === DEFAULT_ADMIN.username) throw new Error("不能修改系统管理员");
  users[idx].role = newRole;
  await putCOSData("data/users.json", users);
}

export async function deleteUser(username) {
  if (!isCOSReady()) throw new Error("COS 未初始化");
  const users = await getUsers();
  if (!users.find(u => u.username === username)) throw new Error("用户不存在");
  if (users.find(u => u.username === username).role === "admin") throw new Error("不能删除管理员");
  await putCOSData("data/users.json", users.filter(u => u.username !== username));
}
