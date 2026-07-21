import { defineStore } from "pinia";
import { getCOSData, putCOSData, initCOSSaved } from "@/utils/cos";

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
    dataLoaded: false,   // 标记数据是否已加载
    loading: false,       // 正在加载中
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.role === "admin",
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
      try {
        await putCOSData(`data/${type}-jobs.json`, this.jobs[type]);
      } catch (e) {
        console.warn("COS未就绪，数据仅在本地保存", e);
      }
    },
    async fetchComments() {
      try {
        const data = await this.getCOSDataSafe("data/comments.json");
        this.comments = data || [];
      } catch (e) {
        this.comments = [];
      }
    },
    async saveComments() {
      await putCOSData("data/comments.json", this.comments);
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
    async addComment(comment) {
      this.comments.unshift({
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
      await this.saveComments();
    },
    async deleteComment(commentId) {
      this.comments = this.comments.filter((c) => c.id !== commentId);
      await this.saveComments();
    },

    /** 首次初始化 - 加载 COS 配置和数据 */
    async initApp() {
      if (this.loading) return; // 防止重复加载
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
        console.log("数据加载完成");
      } catch (e) {
        console.error("数据加载失败:", e);
      } finally {
        this.loading = false;
      }
    },

    /** 确保数据已加载 - 每个页面都可以安全调用 */
    async ensureDataLoaded() {
      if (!this.dataLoaded && !this.loading) {
        await this.initApp();
      }
    },
  },
});
