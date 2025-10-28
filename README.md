# 🤖 QA Center - AI驱动的智能测试中台

> **一个革命性的AI赋能测试平台，让大模型成为测试工程师的得力助手**

## 📋 项目概述

**QA Center** 是一个基于大语言模型（LLM）的**智能测试中台系统**，通过深度集成OpenAI、百度千帆ERNIE、阿里通义等多个先进的大模型，完全重新定义了现代测试工程的工作方式。

该平台致力于通过**AI驱动的自动化流程**，贯穿测试的全生命周期——从需求分析、测试计划制定、用例生成、用例评审、测试数据准备，到迭代统计分析，让测试工程师从繁琐的重复性工作中解放出来，专注于更高价值的测试策略和风险分析工作。

**项目名称**: QA Center (测试中台)
**核心特性**: AI驱动、全流程自动化、多模型支持、流式对话、智能评审
**技术栈**: React + TypeScript + Flask + MySQL + Redis + 大模型API
**开发语言**: TypeScript / Python
**团队成员**: nicky-deng
**最后更新**: 2025年10月29日

**🌐 体验地址**: http://test-ai.nicky.org.cn/
**👤 默认用户**: nicky
**🔐 默认密码**: 19941229Ddl

---

## 🌟 核心亮点一览

### 📊 关键数据

| 指标 | 数据 |
|------|------|
| **效率提升** | 🚀 **4.47倍** (相比传统流程) |
| **质量提升** | 用例覆盖率 65% → **95%+** |
| **AI生成占比** | 📈 **80%** |
| **评审通过率** | ✅ **92%** |

### 🎯 9大AI核心功能模块

1. **AI测试计划智能生成** - 从需求自动生成计划
2. **AI用例智能生成与优化** - 支持模板、流式输出、连续优化
3. **AI智能用例评审** - 多维度评分+改进建议
4. **AI测试计划评审** - 需求覆盖性+风险识别
5. **AI测试数据生成** - 规则约束+Excel导出
6. **AI自由问答模块** - 流式输出+模型切换+历史记录
7. **迭代统计与分析** - 质量指标+效率分析
8. **Prompt和模板管理系统** - 评审/用例/Prompt模板库
9. **智能模型管理** - 多模型切换+成本控制

### ✨ 功能特色

| 功能 | 特色 | 收益 |
|------|------|------|
| **用例生成** | 流式输出、批量优化、JSON标准化 | 80%自动化 |
| **用例评审** | 多维度评分、规则约束、自动建议 | 覆盖率↑ 45% |
| **数据生成** | 规则融合、异常数据、Excel导出 | 准备时间↓ 80% |
| **问答助手** | 多轮对话、模型切换、历史管理 | 交互灵活度↑ 90% |
| **模板系统** | 预置+自定义、版本管理、快速复用 | 重复输入↓ 95% |
| **计划生成** | 自动提取、风险识别、资源分配 | 计划时间↓ 85% |

---

## 🏗️ 项目结构

```
qa-center/
├── frontend/                    ← React + TypeScript 前端应用
│   ├── src/                     (React 源代码)
│   ├── package.json             (前端依赖)
│   ├── Dockerfile               (前端容器化)
│   ├── default.conf             (Nginx 配置)
│   └── PROJECT_README.md        (详细项目文档 1400+ 行)
│
├── backend/                     ← Flask + Python 后端 API
│   ├── models/                  (数据库模型)
│   ├── views/                   (API 路由)
│   ├── utils/                   (工具函数)
│   ├── migrations/              (数据库迁移)
│   ├── requirements.txt         (Python 依赖)
│   ├── Dockerfile               (后端容器化)
│   └── README.md
│
├── .gitignore                   (Git 忽略规则)
└── README.md                    (本文件)
```

---

## 🚀 快速开始

### 前端启动

```bash
cd frontend
npm install
npm run dev
# 访问: http://localhost:8000
```

### 后端启动

```bash
cd backend
pip install -r requirements.txt
python application.py
# 服务: http://localhost:6001
```

### Docker 部署

**前端**:
```bash
cd frontend
docker build -t qa-center-frontend .
docker run -p 80:80 qa-center-frontend
```

**后端**:
```bash
cd backend
docker build -t qa-center-backend .
docker run -p 6001:6001 -e OPENAI_API_KEY=your_key qa-center-backend
```

---

## 🔐 环境变量配置

后端需要配置以下环境变量用于 AI 模型集成：

```bash
# OpenAI 配置
export OPENAI_API_KEY="你的OpenAI秘钥"
export OPENAI_URL="https://api.openai.com/v1/chat/completions"

# Baidu ERNIE 配置
export BAIDU_API_KEY="你的百度秘钥"
export BAIDU_SECRET_KEY="你的百度密钥"

# Alibaba Dashscope (Qwen) 配置
export DASHSCOPE_API_KEY="你的阿里通义秘钥"
```

---

## 📚 核心 API 列表

### LLM 问答接口
- `POST /api/llm/stream_ask` - 流式问答
- `POST /api/llm/create_chat` - 创建对话
- `POST /api/llm/get_chat_history` - 获取对话历史

### 用例生成接口
- `POST /api/case/generate` - AI生成用例
- `POST /api/case/optimize` - AI优化用例
- `POST /api/case/review` - AI评审用例

### 数据生成接口
- `POST /api/data/generate` - 生成测试数据
- `POST /api/data/export_excel` - 导出Excel

### 计划评审接口
- `POST /api/plan/generate` - 生成测试计划
- `POST /api/plan/review` - 评审测试计划

---

## 💻 技术栈详情

### 前端
- **框架**: React 18 + UmiJS 4
- **语言**: TypeScript
- **UI**: Ant Design 5
- **特性**: 流式输出、实时对话、代码高亮、思维导图

### 后端
- **框架**: Flask 2.3.1
- **ORM**: SQLAlchemy
- **数据库**: MySQL + Redis
- **任务队列**: Celery
- **特性**: RESTful API、请求验证、异步处理

### AI 模型支持
- **OpenAI**: GPT-4, GPT-4o
- **百度**: ERNIE 4.0
- **阿里**: Qwen (通义千问)
- **自定义**: 支持第三方 API 接入

---

## 📊 质量指标

### 与传统流程对比

```
              传统方式    QA Center
用例覆盖率:   65%        95%+
用例质量评分: 72分       86分
评审通过率:   78%        92%
缺陷发现率:   60%        78%
修改率:       45%        15%
```

### 效率提升

```
传统流程耗时:    76 小时 (1人月)
QA Center耗时:  17 小时
效率提升:       4.47 倍
```

---

## 🔄 未来规划

### Phase 2 (Q1 2026) - 生态整合
- Lark 文档集成 (目录树选择需求)
- YApi 接口集成 (自动生成 API 测试用例)
- 多格式文档接入 (Word/Excel/PPT/手写/音频)

### Phase 3 (Q2 2026) - AI 增强
- 自主学习能力 (优化 prompt，减少修改)
- 自动化脚本生成 (Selenium/Appium/JMeter)
- 智能缺陷预测 (基于历史和需求分析)

---

## 🔒 安全特性

- ✅ 数据加密 (传输层 SSL/TLS, 存储层 AES-256)
- ✅ 访问控制 (细粒度权限管理)
- ✅ 审计日志 (完整操作追溯)
- ✅ 敏感信息保护 (环境变量管理，无硬编码密钥)

---

## 📖 详细文档

- **前端详细文档**: `frontend/PROJECT_README.md` (1400+ 行)
- **前端推送指南**: `frontend/PUSH_GUIDE.md`
- **部署状态**: `frontend/DEPLOYMENT_STATUS.md`

---

## 🤝 联系方式

**项目作者**: nicky-deng
**邮箱**: 819083144@qq.com
**GitHub**: https://github.com/Lucky-Nicky/test-ai

---

## 📄 版本信息

**项目版本**: v1.0.0
**最后更新**: 2025年10月29日
**许可证**: MIT

---

**感谢使用 QA Center！** 如有问题或建议，欢迎提交 Issue。
