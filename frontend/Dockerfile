FROM node:20-alpine

WORKDIR /app

# Copy package trước (cache layer)
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

# Nhận API URL lúc build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]