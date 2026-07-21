import { defineStore } from "pinia";
import { getCOSData, putCOSData, initCOSSaved, isCOSReady } from "@/utils/cos";

const PENDING_COMMENTS_KEY = "pending_comments";

export const useAppStore = defineStore("app", {
  state: () => ({
    siteConfig: {
      title: "职评网 - 找工作避雷指南",
      backgroundImage: "",
      primaryColor: "#4f46e5",
    },
    currentUser: JSON.parse(localStorage.getItem("currentUser") || "null"),
    jobs: {
      good: [],
      medium: [],
      bad: [],
    },
    comments: [],
    dataLoaded: false,
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.role === "admin",
    cosReady: () => isCOSReady(),
  },
  actions: {
    setUser(user) {
      this.currentUser = user;
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
      } else {
        localStorage.removeItem("currentUser");
      }
    },
    logout() {
      this.setUser(null);
    },
    async fetchSiteConfig() {
      try {
        const data = await this.getCOSDataSafe("config/site-config.json");
        if (data) this.siteConfig = { ...this.siteConfig, ...data };
      } catch (e) {
        console.log("使用默认配置");
      }
    },
    async saveSiteConfig() {
      await putCOSData("config/site-config.json", this.siteConfig);
    },
    async fetchJobs(type) {
      try {
        const data = await this.getCOSDataSafe(`data/${type}-jobs.json`);
        this.jobs[type] = data || [];
      } catch (e) {
        this.jobs[type] = [];
      }
    },
    async saveJobs(type) {
      await putCOSData(`data/${type}-jobs.json`, this.jobs[type]);
    },
    async fetchComments() {
      try {
        const data = await this.getCOSDataSafe("data/comments.json");
        this.comments = data || [];
        // 加载完成后，尝试将本地待处理的评论推送到COS
        await this.flushPendingComments();
      } catch (e) {
        this.comments = [];
      }
    },
    async saveComments() {
      await putCOSData("data/comments.json", this.comments);
    },

    /** 获取本地等待同步的评论 */
    getPendingComments() {
      try {
        const data = localStorage.getItem(PENDING_COMMENTS_KEY);
        return data ? JSON.parse(data) : [];
      } catch { return []; }
    },

    /** 保存待处理评论到 localStorage */
    savePendingComments(comments) {
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(comments));
    },

    /** 将本地待处理的评论推送到 COS（需要管理员已经配置了 COS SDK） */
    async flushPendingComments() {
      const pending = this.getPendingComments();
      if (pending.length === 0) return;
      if (!isCOSReady()) {
        console.log(`待同步评论 ${pending.length} 条，COS未就绪，稍后同步`);
        return;
      }
      console.log(`正在同步 ${pending.length} 条待处理评论到COS...`);
      // 将待处理评论合并到当前评论列表
      let changed = false;
      for (const pc of pending) {
        // 避免重复
        if (!this.comments.find((c) => c.id === pc.id)) {
          this.comments.push(pc);
          changed = true;
        }
      }
      if (changed) {
        await this.saveComments();
        console.log("待处理评论已同步到COS");
      }
      // 清空待处理队列
      this.savePendingComments([]);
    },

    async getCOSDataSafe(key) {
      try {
        return await getCOSData(key);
      } catch (e) {
        console.warn("COS读取失败:", key, e.message);
        return null;
      }
    },

    async addJob(type, job) {
      this.jobs[type].unshift({
        ...job,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
      await this.saveJobs(type);
    },
    async deleteJob(type, jobId) {
      this.jobs[type] = this.jobs[type].filter((j) => j.id !== jobId);
      this.comments = this.comments.filter((c) => c.jobId !== jobId);
      await this.saveJobs(type);
      await this.saveComments();
    },

    /** 添加评论 - 如果有COS密钥则直接写入，否则暂存到本地 */
    async addComment(comment) {
      const newComment = {
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      // 先加入本地状态，界面立刻显示
      this.comments.unshift(newComment);

      if (isCOSReady()) {
        // 管理员：直接保存到 COS
        await this.saveComments();
      } else {
        // 普通用户：暂存到 localStorage，等待管理员访问时同步
        const pending = this.getPendingComments();
        pending.push(newComment);
        this.savePendingComments(pending);
        console.log("评论已暂存到本地，等待管理员访问时自动同步到COS");
      }
    },

    async deleteComment(commentId) {
      this.comments = this.comments.filter((c) => c.id !== commentId);
      if (isCOSReady()) {
        await this.saveComments();
      }
    },

    /** 强制将所有本地数据同步到COS */
    async syncAllToCOS() {
      if (!isCOSReady()) {
        throw new Error("COS 未初始化，请先在管理后台配置密钥");
      }
      // 先刷新待处理评论
      await this.flushPendingComments();
      const results = [];
      for (const type of ["good", "medium", "bad"]) {
        await this.saveJobs(type);
        results.push(`${type}: ${this.jobs[type].length}条`);
      }
      await this.saveComments();
      results.push(`评论: ${this.comments.length}条`);
      await this.saveSiteConfig();
      results.push("站点配置");
      return results.join(" | ");
    },

    async initApp() {
      if (this.loading) return;
      this.loading = true;
      try {
        await initCOSSaved();
        await this.fetchSiteConfig();
        await Promise.all([
          this.fetchJobs("good"),
          this.fetchJobs("medium"),
          this.fetchJobs("bad"),
          this.fetchComments(),
        ]);
        this.dataLoaded = true;
      } catch (e) {
        console.error("数据加载失败:", e);
      } finally {
        this.loading = false;
      }
    },

    async ensureDataLoaded() {
      if (!this.dataLoaded && !this.loading) {
        await this.initApp();
      }
    },
  },
});
