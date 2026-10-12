# Risk Radar website: build the Angular app, then serve it with nginx.
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

FROM nginx:1.27-alpine
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/frontend-angular/browser /usr/share/nginx/html
EXPOSE 80
