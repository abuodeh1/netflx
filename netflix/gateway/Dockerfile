FROM nginx:stable-alpine

# Remove the default Nginx site config and copy the gateway config
# (Ensure the source filename matches your actual file, e.g., nginx.conf or nginx_4.conf)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]