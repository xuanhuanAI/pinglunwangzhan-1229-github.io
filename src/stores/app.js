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
    companies: [],    // 已收录的公司列表 [{name:"公司名", addedBy:"", addedAt:""}]
    dataLoaded: false,
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.role === "admin",
    cosReady: () => isCOSReady(),
    // 所有公司名列表（方便搜索匹配）
    companyNames: (state) => state.companies.map((c) => c.name),
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
      } catch (e) { console.log("使用默认配置"); }
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
        await this.flushPendingComments();
      } catch (e) {
        this.comments = [];
      }
    },
    async saveComments() {
      await putCOSData("data/comments.json", this.comments);
    },

    // ==================== 公司管理 ====================

    /** 从 COS 加载已收录的公司名单 */
    async fetchCompanies() {
      try {
        const data = await this.getCOSDataSafe("data/companies.json");
        this.companies = data || [];
      } catch (e) {
        this.companies = [];
      }
    },

    /** 保存公司名单到 COS */
    async saveCompanies() {
      await putCOSData("data/companies.json", this.companies);
    },

    /** 自动从所有工作中提取公司名，合并到公司库 */
    async extractCompaniesFromJobs() {
      const nameSet = new Set(this.companies.map((c) => c.name));
      let added = 0;
      for (const type of ["good", "medium", "bad"]) {
        for (const job of this.jobs[type]) {
          if (job.company && !nameSet.has(job.company)) {
            nameSet.add(job.company);
            this.companies.push({
              name: job.company,
              addedBy: "system",
              addedAt: new Date().toISOString(),
            });
            added++;
          }
        }
      }
      if (added > 0) {
        await this.saveCompanies();
        console.log(`自动添加了 ${added} 个公司到公司库`);
      }
      return added;
    },

    /** 添加公司到收录名单 */
    async addCompany(name) {
      const exists = this.companies.find(
        (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (exists) throw new Error("该公司已在收录名单中");
      this.companies.push({
        name: name.trim(),
        addedBy: this.currentUser?.username || "unknown",
        addedAt: new Date().toISOString(),
      });
      await this.saveCompanies();
    },

    /** 从收录名单中删除公司 */
    async removeCompany(name) {
      this.companies = this.companies.filter(
        (c) => c.name.trim().toLowerCase() !== name.trim().toLowerCase()
      );
      // 不同步删除已有工作，只是不允许新发布使用此公司
      await this.saveCompanies();
    },

    /** 批量添加公司（管理员用，逗号/换行分隔） */
    async addCompaniesBulk(text) {
      const names = text
        .split(/[,，\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length === 0) throw new Error("没有有效的公司名称");
      let added = 0;
      for (const name of names) {
        const exists = this.companies.find(
          (c) => c.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (!exists) {
          this.companies.push({
            name,
            addedBy: this.currentUser?.username || "unknown",
            addedAt: new Date().toISOString(),
          });
          added++;
        }
      }
      if (added === 0) throw new Error("这些公司都已存在，无需重复添加");
      await this.saveCompanies();
      return added;
    },

    /** 校验公司名是否在收录名单中 */
    validateCompany(companyName) {
      if (!companyName || !companyName.trim()) {
        return { valid: false, message: "请输入公司名称" };
      }
      const match = this.companies.find(
        (c) => c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
      );
      if (match) return { valid: true, match: match.name };
      // 尝试模糊匹配
      const fuzzy = this.companies.filter((c) =>
        c.name.includes(companyName.trim()) ||
        companyName.includes(c.name)
      );
      return {
        valid: false,
        suggestions: fuzzy.map((c) => c.name),
        message: fuzzy.length > 0
          ? `「${companyName}」不在收录名单中。你要找的是不是：${fuzzy.map(c => c.name).join("、")}？`
          : `「${companyName}」尚未被收录，无法发布。请联系管理员添加该公司。`,
      };
    },

    // ==================== 评论暂存 ====================

    getPendingComments() {
      try {
        const data = localStorage.getItem(PENDING_COMMENTS_KEY);
        return data ? JSON.parse(data) : [];
      } catch { return []; }
    },
    savePendingComments(comments) {
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(comments));
    },
    async flushPendingComments() {
      const pending = this.getPendingComments();
      if (pending.length === 0) return;
      if (!isCOSReady()) {
        console.log(`待同步评论 ${pending.length} 条，COS未就绪`);
        return;
      }
      let changed = false;
      for (const pc of pending) {
        if (!this.comments.find((c) => c.id === pc.id)) {
          this.comments.push(pc);
          changed = true;
        }
      }
      if (changed) {
        await this.saveComments();
        console.log("待处理评论已同步到COS");
      }
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
      // 先校验公司名
      const validation = this.validateCompany(job.company);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
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
      const newComment = {
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      this.comments.unshift(newComment);
      if (isCOSReady()) {
        await this.saveComments();
      } else {
        const pending = this.getPendingComments();
        pending.push(newComment);
        this.savePendingComments(pending);
      }
    },
    async deleteComment(commentId) {
      this.comments = this.comments.filter((c) => c.id !== commentId);
      if (isCOSReady()) {
        await this.saveComments();
      }
    },

    /** 强制同步所有数据到COS */
    async syncAllToCOS() {
      if (!isCOSReady()) {
        throw new Error("COS 未初始化，请在管理后台配置密钥");
      }
      await this.flushPendingComments();
      const results = [];
      for (const type of ["good", "medium", "bad"]) {
        await this.saveJobs(type);
        results.push(`${type}: ${this.jobs[type].length}条`);
      }
      await this.saveComments();
      results.push(`评论: ${this.comments.length}条`);
      await this.saveCompanies();
      results.push(`公司: ${this.companies.length}个`);
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
          this.fetchCompanies(),
        ]);
        // 自动从已有工作中提取公司名
        if (isCOSReady()) {
          await this.extractCompaniesFromJobs();
        }
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
