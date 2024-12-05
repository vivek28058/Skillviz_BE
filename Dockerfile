# Use the official Bun image as the base
FROM oven/bun:1.1.23 AS base
WORKDIR /app
 
# Install dependencies into a temporary directory
FROM base AS install
COPY package.json bun.lockb /app/
RUN bun install 
 
# Copy the application code into the image
FROM base AS dev
COPY --from=install /app/node_modules /app/node_modules
COPY . /app
 
# Optionally run a build step if needed
RUN bun run build
 
# Use Nginx as the base for the final image
FROM nginx:alpine AS release
COPY --from=dev /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
 
# Expose the port on which Nginx will run
EXPOSE 80
 
# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
