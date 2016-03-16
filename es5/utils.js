'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.getBrowser = getBrowser;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _globalDocument = require('global/document');

var _globalDocument2 = _interopRequireDefault(_globalDocument);

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

function getBrowser() {
	var data = {};

	var browser = '';

	var version = '';

	var os = '';

	var osVersion = '';

	var parseUserAgent = undefined;

	var prepareData = undefined;

	var renameOsx = undefined;

	var cutSafariVersion = undefined;

	parseUserAgent = function () {
		var userAgent = navigator.userAgent.toLowerCase();

		var browserParts = /(ie|firefox|chrome|safari|opera)(?:.*version)?(?:[ \/])?([\w.]+)/.exec(userAgent);

		var osParts = /(mac|win|linux|freebsd|mobile|iphone|ipod|ipad|android|blackberry|j2me|webtv)/.exec(userAgent);

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

	prepareData = function () {
		data.browser = browser;
		data.version = parseInt(version, 10) || '';
		data.os = os;
		data.osVersion = osVersion;
	};

	renameOsx = function () {
		if (os === 'mac') {
			os = 'osx';
		}
	};

	cutSafariVersion = function () {
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