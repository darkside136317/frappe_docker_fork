#!/bin/bash
CONF="/etc/nginx/conf.d/frappe.conf"
sed -i 's|proxy_set_header Origin $proxy_x_forwarded_proto://[^;]*;|proxy_set_header Origin $scheme://$http_host;|' "$CONF"
sed -i 's|proxy_set_header Host $host;|proxy_set_header Host $http_host;|g' "$CONF"
nginx -t && nginx -s reload && echo "nginx reloaded"
