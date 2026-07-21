/* COS配置工具 - 支持匿名读取 */
// ========== 默认配置（会被 cos-config.json 和 localStorage 覆盖） ==========
let COS_CONFIG = {
  Bucket: "",
  Region: "",
};

let cosInstance = null;
let publicConfigPromise = null; // 缓存 cos-config.json 的请求

const STORAGE_KEY = "cos_config";

/** 从 localStorage 加载管理员保存的配置 */
export function loadSavedConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      return config;
    }
  } catch (e) {}
  return null;
}

/** 从部署的静态文件获取公共桶配置 */
function fetchPublicConfig() {
  if (publicConfigPromise) return publicConfigPromise;
  publicConfigPromise = fetch("./cos-config.json")
    .then((res) => {
      if (!res.ok) throw new Error("找不到公共配置文件");
      return res.json();
    })
    .then((config) => {
      if (config.Bucket && config.Bucket !== "your-bucket-1250000000") {
        COS_CONFIG.Bucket = config.Bucket;
        COS_CONFIG.Region = config.Region || COS_CONFIG.Region;
      }
      return config;
    })
    .catch(() => {
      // 如果 cos-config.json 不存在或无效，尝试从 localStorage 读取
      const saved = loadSavedConfig();
      if (saved && saved.Bucket) {
        COS_CONFIG.Bucket = saved.Bucket;
        COS_CONFIG.Region = saved.Region || COS_CONFIG.Region;
        return saved;
      }
      return null;
    });
  return publicConfigPromise;
}

export function getCOS() {
  return cosInstance;
}

export async function initCOS(config) {
  const COSSDK = await import("cos-js-sdk-v5");
  cosInstance = new COSSDK.default({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
  });
  COS_CONFIG.Bucket = config.Bucket || COS_CONFIG.Bucket;
  COS_CONFIG.Region = config.Region || COS_CONFIG.Region;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return cosInstance;
}

export function getCOSConfig() {
  return COS_CONFIG;
}

/** COS 公开读取的基础 URL */
function getCOSPublicBaseURL() {
  return `https://${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com/`;
}

/**
 * 读取 COS 数据 - 支持两种模式：
 * 1. SDK 模式（管理员已配置密钥时使用）
 * 2. 匿名 HTTP GET 模式（普通访客使用，需存储桶开启公有读）
 */
export function getCOSData(key) {
  return new Promise((resolve, reject) => {
    // 模式1：SDK 已初始化，用 SDK 读取
    if (cosInstance) {
      cosInstance.getObject(
        {
          Bucket: COS_CONFIG.Bucket,
          Region: COS_CONFIG.Region,
          Key: key,
        },
        (err, data) => {
          if (err) {
            if (err.code === "NoSuchKey" || err.statusCode === 404)
              resolve(null);
            else reject(err);
          } else {
            try {
              resolve(JSON.parse(data.Body));
            } catch {
              resolve(data.Body);
            }
          }
        }
      );
      return;
    }

    // 模式2：SDK 未初始化，先用公共配置文件获取桶信息
    fetchPublicConfig()
      .then(() => {
        if (!COS_CONFIG.Bucket) {
          reject(new Error("COS 未配置，请先在管理后台配置或创建 cos-config.json"));
          return;
        }
        const url = getCOSPublicBaseURL() + key;
        return fetch(url);
      })
      .then((res) => {
        if (!res) return;
        if (res.status === 404) return null;
        if (!res.ok)
          throw new Error("COS 读取失败: HTTP " + res.status);
        return res.json();
      })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
}

/** 写入 COS 数据 - 必须使用 SDK */
export function putCOSData(key, data) {
  return new Promise((resolve, reject) => {
    if (!cosInstance) {
      reject(new Error("COS 未初始化，请在管理后台配置密钥"));
      return;
    }
    cosInstance.putObject(
      {
        Bucket: COS_CONFIG.Bucket,
        Region: COS_CONFIG.Region,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
}

/** 删除 COS 数据 - 必须使用 SDK */
export function deleteCOSData(key) {
  return new Promise((resolve, reject) => {
    if (!cosInstance) {
      reject(new Error("COS 未初始化，请在管理后台配置密钥"));
      return;
    }
    cosInstance.deleteObject(
      {
        Bucket: COS_CONFIG.Bucket,
        Region: COS_CONFIG.Region,
        Key: key,
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
}

/** 上传文件到 COS - 必须使用 SDK */
export function uploadFile(key, file) {
  return new Promise((resolve, reject) => {
    if (!cosInstance) {
      reject(new Error("COS 未初始化，请在管理后台配置密钥"));
      return;
    }
    cosInstance.putObject(
      {
        Bucket: COS_CONFIG.Bucket,
        Region: COS_CONFIG.Region,
        Key: key,
        Body: file,
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
}

/** 尝试从 localStorage 加载配置并初始化 COS */
export async function initCOSSaved() {
  const saved = loadSavedConfig();
  if (saved && saved.SecretId && saved.SecretKey) {
    await initCOS(saved);
    return true;
  }
  // 即使 SDK 没初始化，也尝试加载公共配置
  await fetchPublicConfig();
  return false;
}
