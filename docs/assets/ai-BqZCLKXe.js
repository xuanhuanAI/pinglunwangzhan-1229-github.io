let a=null;async function l(){if(a)return!0;try{const s=await fetch("https://qwertyuiop-1454067625.cos.ap-guangzhou.myqcloud.com/config/ai-key.json");if(s.ok){const r=await s.json();return a={apiKey:r.apiKey,model:r.model||"deepseek-chat",baseUrl:r.baseUrl||"https://api.deepseek.com/v1"},!0}}catch{}return!1}async function u(s,r){if(!a&&!await l())return{valid:!0,message:""};const n=`你是一个企业信息校验专家。请判断以下公司名和职位是否真实存在。

公司名称: ${s}
岗位名称: ${r}

请用 JSON 格式回答，包含以下字段：
- valid: true/false（是否真实存在）
- companyValid: true/false（公司名是否真实）
- titleValid: true/false（岗位名是否合理）
- similarCompany: string（如果公司名有误，给出最接近的真实公司名，否则空字符串）
- similarTitle: string（如果岗位名有误，给出最接近的真实岗位名，否则空字符串）
- reason: string（简短的判断理由）

注意：中文公司名通常以"有限公司"、"集团"、"股份"、"公司"结尾。
注意：如果是知名企业（腾讯、阿里、字节、华为等），直接判定为有效。`;try{const e=await fetch(a.baseUrl+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a.apiKey},body:JSON.stringify({model:a.model,messages:[{role:"system",content:"你是一个企业信息校验专家。只输出 JSON，不要附加其他内容。"},{role:"user",content:n}],temperature:.1})});if(!e.ok){const i=await e.text();throw new Error("AI 请求失败: "+e.status+" "+i)}const o=(await e.json()).choices[0].message.content.match(/\{[\s\S]*\}/);if(!o)throw new Error("AI 返回格式异常");const t=JSON.parse(o[0]);if(!t.valid){let i=t.reason||"信息可能不真实";return t.similarCompany&&(i+="。你是否想找: "+t.similarCompany),t.similarTitle&&(i+=" / 职位: "+t.similarTitle),{valid:!1,message:i}}return{valid:!0,message:""}}catch(e){return console.warn("AI 校验失败，放行:",e.message),{valid:!0,message:""}}}export{u as v};
