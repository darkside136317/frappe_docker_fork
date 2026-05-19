#!/usr/bin/env python3
"""Patch live nginx so socket.io auth callbacks use the correct Origin (with port)."""
from pathlib import Path

CONF = Path("/etc/nginx/conf.d/frappe.conf")
text = CONF.read_text()
text = text.replace(
    "proxy_set_header Origin $proxy_x_forwarded_proto://ury.local;",
    "proxy_set_header Origin $scheme://$http_host;",
)
text = text.replace(
    "\t\tproxy_set_header Origin $scheme://$http_host;\n"
    "\t\tproxy_set_header Host $host;\n\n"
    "\t\tproxy_pass http://socketio-server;",
    "\t\tproxy_set_header Origin $scheme://$http_host;\n"
    "\t\tproxy_set_header Host $http_host;\n\n"
    "\t\tproxy_pass http://socketio-server;",
)
CONF.write_text(text)
print("patched", CONF)
