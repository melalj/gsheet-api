FROM node:20.11-slim
RUN mkdir -p /app
WORKDIR /app
ADD . /app
RUN npm ci --ignore-scripts
CMD ["node", "index.js"]
