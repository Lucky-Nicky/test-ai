# 第一阶段：构建阶段
FROM node:14 as builder

WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制所有源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：运行阶段
FROM nginx:latest

# 复制构建输出到 nginx html 目录
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY default.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
