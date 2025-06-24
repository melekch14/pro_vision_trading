# front/Dockerfile

# Stage 1: Build Angular app
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy favicon.ico from public to src if it doesn't exist in src
RUN if [ ! -f src/favicon.ico ] && [ -f public/favicon.ico ]; then cp public/favicon.ico src/favicon.ico; fi

RUN npm run build -- --configuration production --project optician

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy the built application
COPY --from=builder /app/dist/optician/browser /usr/share/nginx/html

# Create a custom nginx configuration for Angular routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Handle favicon.ico specifically \
    location = /favicon.ico { \
        log_not_found off; \
        access_log off; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
