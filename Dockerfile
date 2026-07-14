# Multi-stage: build the Vite React SPA, then serve it with Nginx.
#
# Base images come from the internal 0-CVE registry (Wolfi-based):
#   - img.aksg.net/nodejs/nodejs:latest  (Node 24 + npm)
#   - img.aksg.net/nginx/nginx:latest    (nginx 1.30)
#
# Build context is the project root. The internal Nginx only serves the SPA;
# the user's external Nginx remains responsible for the public domain, TLS,
# access control, and reverse proxying to this container's port.
FROM img.aksg.net/nodejs/nodejs:latest AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM img.aksg.net/nginx/nginx:latest

ARG BUILD_DATE=""

RUN mkdir -p /usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html
COPY version.json /usr/share/nginx/html/version.json
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

# Stamp the build date into the in-image version metadata.
RUN if [ -n "$BUILD_DATE" ]; then \
      sed -i "s/\"buildDate\": \"\"/\"buildDate\": \"$BUILD_DATE\"/" /usr/share/nginx/html/version.json; \
    fi

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
