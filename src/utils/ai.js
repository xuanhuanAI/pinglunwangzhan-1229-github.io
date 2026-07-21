// AI 校验工具 - 支持 OpenAI / DeepSeek 等兼容 API
let aiConfig = null; // { apiKey, model, baseUrl }

/** 加载 AI 配置（从 COS 公共配置） */
export async function loadAIConfig() {
  if (aiConfig) return true;
  try {
    const res = await fetch(
      `https://qwertyuiop-1454067625.cos.ap-guangzhou.myqcloud.com/config/ai-key.json`
    );
    if (res.ok) {
      const data = await res.json();
      aiConfig = {
        apiKey: data.apiKey,
        model: data.model || "deepseek-chat",
        baseUrl: data.baseUrl || "https://api.deepseek.com/v1",
      };
      return true;
    }
  } catch (e) {}
  return false;
}

/** 获取 AI 配置 */
export function getAIConfig() { return aiConfig; }

/** 设置 AI 配置 */
export function setAIConfig(config) { aiConfig = config; }

/** 可用的 AI 提供商 */
export const AI_PROVIDERS = [
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", models: ["deepseek-chat", "deepseek-reasoner"] },
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1", models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"] },
];

/** 调用 AI 校验公司名和职位名是否真实存在 */
export async function validateWithAI(company, title) {
  if (!aiConfig) {
    const loaded = await loadAIConfig();
    if (!loaded) return { valid: true, message: "" };
  }

  const prompt = `你是一个企业信息校验专家。请判断以下公司名和职位是否真实存在。

公司名称: ${company}
岗位名称: ${title}

请用 JSON 格式回答，包含以下字段：
- valid: true/false（是否真实存在）
- companyValid: true/false（公司名是否真实）
- titleValid: true/false（岗位名是否合理）
- similarCompany: string（如果公司名有误，给出最接近的真实公司名，否则空字符串）
- similarTitle: string（如果岗位名有误，给出最接近的真实岗位名，否则空字符串）
- reason: string（简短的判断理由）

注意：中文公司名通常以"有限公司"、"集团"、"股份"、"公司"结尾。
注意：如果是知名企业（腾讯、阿里、字节、华为等），直接判定为有效。`;

  try {
    const response = await fetch(aiConfig.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + aiConfig.apiKey,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: "你是一个企业信息校验专家。只输出 JSON，不要附加其他内容。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("AI 请求失败: " + response.status + " " + errText);
    }

    const result = await response.json();
    const text = result.choices[0].message.content;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 返回格式异常");

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.valid) {
      let msg = parsed.reason || "信息可能不真实";
      if (parsed.similarCompany) msg += "。你是否想找: " + parsed.similarCompany;
      if (parsed.similarTitle) msg += " / 职位: " + parsed.similarTitle;
      return { valid: false, message: msg };
    }

    return { valid: true, message: "" };
  } catch (e) {
    console.warn("AI 校验失败，放行:", e.message);
    return { valid: true, message: "" };
  }
}

