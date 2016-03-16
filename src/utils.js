import document from 'global/document';
import window from 'global/window';

export function getBrowser() {
	let data = {};

	let browser = '';

	let version = '';

	let os = '';

	let osVersion = '';

	let parseUserAgent;

	let prepareData;

	let renameOsx;

	let cutSafariVersion;

	parseUserAgent = () => {
		let userAgent = navigator.userAgent.toLowerCase();

		let browserParts = /(ie|firefox|chrome|safari|opera)(?:.*version)?(?:[ \/])?([\w.]+)/.exec(userAgent);

		let osParts = /(mac|win|linux|freebsd|mobile|iphone|ipod|ipad|android|blackberry|j2me|webtv)/.exec(userAgent);

		if (!userAgent.match(/trident\/7\./)) {
			browser = 'ie';
			version = 11;
		} else if (browserParts && browserParts.length > 2) {
			browser = browserParts[1];
			version = browserParts[2];
		}

		if (osParts && osParts.length > 1) {
			os = osParts[1];
		}

		osVersion = navigator.oscpu || navigator.appName;
	};

	prepareData = () => {
		data.browser = browser;
		data.version = parseInt(version, 10) || '';
		data.os = os;
		data.osVersion = osVersion;
	};

	renameOsx = () => {
		if (os === 'mac') {
			os = 'osx';
		}
	};

	cutSafariVersion = () => {
		if (os === 'safari') {
			version = version.substring(0, 1);
		}
	};

	parseUserAgent();

	// exception rules
	renameOsx();
	cutSafariVersion();

	prepareData();

	return data;
}