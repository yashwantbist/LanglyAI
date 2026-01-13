# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json from app/
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy all source files from app/
COPY app/ ./

# Build the React app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
