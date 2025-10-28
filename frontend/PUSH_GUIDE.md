# 🚀 QA Center 项目推送指南

## 📌 当前状态

### ✅ 已完成
- [x] 前端项目本地 Git 提交完成
- [x] 后端项目本地 Git 提交完成
- [x] 优化 `.gitignore` 文件
- [x] 添加项目文档 (`PROJECT_README.md`)
- [x] 配置 Git 远程仓库
- [x] 验证提交历史

### ⏳ 待推送
- [ ] 推送前端项目到 GitHub
- [ ] 推送后端项目到 GitHub

---

## 🔐 推送认证方式

由于 GitHub 不再支持密码认证，有以下几种方案：

### 方案 1: 使用个人访问令牌 (PAT) - ⭐ 推荐

1. 登录 GitHub: https://github.com/Lucky-Nicky
2. 进入 Settings → Developer settings → Personal access tokens → Fine-grained tokens
3. 生成新的 PAT，权限选择:
   - `repo` (完整 repo 访问)
   - `write:repo_hook` (写 webhook)
4. 复制生成的令牌

5. 执行以下命令：
```bash
# 设置凭证缓存
git config --global credential.helper cache

# 推送前端项目
cd /root/qa-center-web
git push origin master

# 推送后端项目
cd /root/qa-center-service
git push origin master
```

提示输入用户名时输入: `Lucky-Nicky`
提示输入密码时输入: `<生成的 PAT 令牌>`

---

### 方案 2: 使用 SSH 密钥

1. 生成 SSH 密钥：
```bash
ssh-keygen -t ed25519 -C "819083144@qq.com"
# 连续按 Enter 采用默认设置
```

2. 查看公钥：
```bash
cat ~/.ssh/id_ed25519.pub
```

3. 添加到 GitHub:
   - 登录 GitHub → Settings → SSH and GPG keys
   - 点击 "New SSH key"
   - 粘贴公钥内容
   - 保存

4. 验证 SSH 连接：
```bash
ssh -T git@github.com
```

5. 推送项目：
```bash
# 前端
cd /root/qa-center-web
git remote set-url origin git@github.com:Lucky-Nicky/test-ai.git
git push origin master

# 后端
cd /root/qa-center-service
git remote set-url origin git@github.com:Lucky-Nicky/test-ai.git
git push origin master
```

---

### 方案 3: 存储凭证（本地开发推荐）

1. 配置 Git 凭证存储：
```bash
git config --global credential.helper store
```

2. 第一次推送时输入凭证：
```bash
cd /root/qa-center-web
git push origin master
# 输入用户名: Lucky-Nicky
# 输入密码: <PAT 令牌或密码>
```

3. 之后的推送会自动使用保存的凭证

---

## 📦 推送项目内容

### 前端项目 (qa-center-web)

**文件清单**:
```
├── src/
│   ├── pages/
│   │   └── ai_chat/
│   │       └── index.tsx (✨ AI问答页面优化)
│   └── layouts/
│       └── index.tsx (✨ 路由优化)
├── package.json (✨ 依赖更新)
├── PROJECT_README.md (✨ 项目文档)
├── Dockerfile (✨ 容器化部署)
├── default.conf (✨ Nginx配置)
├── .gitignore (✨ 优化)
└── ...其他文件
```

**关键改进**:
1. AI 问答模板功能改为按项目获取
2. 项目切换时自动重载模板
3. 输入框高度增加 100%（支持更长输入）
4. 新增详细的项目说明文档
5. 添加容器化部署配置

---

### 后端项目 (qa-center-service)

**文件清单**:
```
├── models/
│   ├── llm.py (✨ 优化)
│   └── users.py (✨ 新增)
├── views/
│   ├── llm.py (✨ 优化)
│   ├── llm_prompt.py (✨ 优化)
│   ├── test_plan.py (✨ 优化)
│   └── login.py (✨ 安全改进)
├── utils/
│   ├── ai_model_handler.py (✨ 优化)
│   ├── jira.py (✨ 优化)
│   ├── confluence.py (✨ 优化)
│   └── MSUtils.py (✨ 优化)
├── migrations/
│   ├── alembic.ini (✨ 新增)
│   ├── env.py (✨ 新增)
│   └── versions/ (✨ 数据库迁移脚本)
├── requirements.txt (✨ 依赖更新)
├── Dockerfile (✨ 优化)
├── .gitignore (✨ 优化)
└── ...其他文件
```

**关键改进**:
1. 数据库迁移脚本完整配置
2. LLM 模型和提示词管理优化
3. 第三方集成（JIRA、Confluence、Microsoft）增强
4. 登录认证安全改进
5. 依赖包更新

---

## 📊 提交统计

| 项目 | 提交哈希 | 描述 |
|------|--------|------|
| 前端 | `0cb451a` | feat: 完善AI问答模块和项目文档 |
| 后端 | `22bd2db` | docs: 添加Git提交总结文档 |

---

## ✅ 推送检查清单

在推送前，确保：

- [ ] 已生成或获取了 GitHub PAT 令牌（或 SSH 密钥）
- [ ] 验证了本地 Git 配置正确：
  ```bash
  git config --global user.name "nicky-deng"
  git config --global user.email "819083144@qq.com"
  ```
- [ ] 确认远程仓库 URL 正确：
  ```bash
  # 前端
  cd /root/qa-center-web
  git remote -v
  # 应显示: origin  https://github.com/Lucky-Nicky/test-ai.git

  # 后端
  cd /root/qa-center-service
  git remote -v
  ```
- [ ] 检查本地提交已完成：
  ```bash
  git log --oneline -3
  ```
- [ ] 网络连接正常

---

## 🚀 快速推送命令

如果已经配置了认证方式，使用以下命令推送：

```bash
#!/bin/bash

# 推送前端项目
echo "🚀 推送前端项目..."
cd /root/qa-center-web
git push origin master -u
echo "✅ 前端项目推送完成"

# 推送后端项目
echo "🚀 推送后端项目..."
cd /root/qa-center-service
git push origin master -u
echo "✅ 后端项目推送完成"

# 验证推送结果
echo "📊 验证推送结果..."
cd /root/qa-center-web
git log origin/master --oneline -1
echo "前端最新提交 ↑"

cd /root/qa-center-service
git log origin/master --oneline -1
echo "后端最新提交 ↑"
```

---

## 🔍 推送后验证

推送完成后，验证是否成功：

```bash
# 检查本地和远程是否同步
cd /root/qa-center-web
git status
# 应显示: "Your branch is up to date with 'origin/master'."

cd /root/qa-center-service
git status
# 应显示: "Your branch is up to date with 'origin/master'."
```

---

## 🌐 GitHub 仓库地址

- **仓库**: https://github.com/Lucky-Nicky/test-ai
- **HTTPS**: https://github.com/Lucky-Nicky/test-ai.git
- **SSH**: git@github.com:Lucky-Nicky/test-ai.git

---

## 📞 故障排除

### 如果推送失败：

1. **认证失败**
   ```bash
   # 清除保存的凭证
   git config --global --unset credential.helper

   # 重新推送，输入正确的凭证
   git push origin master
   ```

2. **网络超时**
   ```bash
   # 增加超时时间
   git config --global http.postBuffer 524288000

   # 重新推送
   git push origin master
   ```

3. **分支冲突**
   ```bash
   # 拉取最新代码
   git pull origin master

   # 解决冲突（如果有）
   # 然后重新推送
   git push origin master
   ```

4. **强制推送（仅在确保无误时）**
   ```bash
   # ⚠️ 小心使用！
   git push origin master --force-with-lease
   ```

---

## 📋 相关文档

- **项目说明**: `/root/qa-center-web/PROJECT_README.md`
- **提交总结**: `GIT_COMMIT_SUMMARY.md` (本文件)
- **GitHub**: https://github.com/Lucky-Nicky/test-ai

---

**最后更新**: 2025年10月28日 23:55
**状态**: ✅ 本地提交完成，等待推送
**下一步**: 使用上述任一方案推送到 GitHub

---

## 💡 建议

1. **优先使用 SSH**: 一次配置，永久使用
2. **其次使用 PAT**: 更安全，可限制权限
3. **避免明文密码**: 不要在命令行中使用明文密码

---

祝推送顺利！🎉
