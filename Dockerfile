FROM node:20-alpine

WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install --legacy-peer-deps

# Копіюємо код
COPY . .

# Білдимо TypeScript
RUN npm run build

EXPOSE 3001

# Запускаємо продакшн
CMD ["node", "dist/main.js"]
