let webserver_port = 8000;
try {
	const common_site_config = require('../../../sites/common_site_config.json');
	webserver_port = common_site_config.webserver_port || webserver_port;
} catch {
	/* Build / dev outside a full frappe-bench tree (e.g. CI or Windows host) */
}

export default {
	'^/(app|api|assets|files)': {
		target: `http://localhost:${webserver_port}`,
		ws: true,
		router: function(req) {
			const site_name = req.headers.host.split(':')[0];
			return `http://${site_name}:${webserver_port}`;
		}
	}
};
