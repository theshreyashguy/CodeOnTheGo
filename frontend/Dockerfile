# development environment
FROM node:16-alpine
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
EXPOSE 3000
CMD ["sh", "-c", "npm run build:css && REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL npm start"]