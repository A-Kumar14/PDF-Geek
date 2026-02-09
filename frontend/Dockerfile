# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

<<<<<<< HEAD
# Install all dependencies (including devDependencies needed for build)
RUN npm ci
=======
# Install dependencies
RUN npm ci --only=production
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f

# Copy source code
COPY . .

<<<<<<< HEAD
# Build-time API URL (optional; default used if not set)
ARG REACT_APP_API_BASE=http://localhost:5000
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
