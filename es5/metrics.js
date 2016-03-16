/**
 * ! videojs-metrics - v0.0.0 - 2016-02-15
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license.
 * @file videojs-metrics.js
 **/
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var _globalDocument = require('global/document');

var _globalDocument2 = _interopRequireDefault(_globalDocument);

var _utilsJs = require('./utils.js');

var browser = _interopRequireWildcard(_utilsJs);

var Component = _videoJs2['default'].getComponent('Component');
var Flash = _videoJs2['default'].getComponent('Flash');

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */

var Metrics = (function (_Component) {
	_inherits(Metrics, _Component);

	function Metrics(player, options) {
		_classCallCheck(this, Metrics);

		_get(Object.getPrototypeOf(Metrics.prototype), 'constructor', this).call(this, player, options);
		var source = this.player().manifestUrl || this.player().currentSrc();

		this.browserInfo = browser.getBrowser();
		this.pathUrl = source.match(Metrics.URL_MATCH) || ['undefined', 'undefined'];
		this.setupTriggers();
	}

	_createClass(Metrics, [{
		key: 'dispose',
		value: function dispose() {
			this.clearInterval(this.intervalPing);
			this.setupTriggers('off');
		}
	}, {
		key: 'eventHandler',
		value: function eventHandler(evt) {
			var data = {
				type: evt.type
			};

			var skipped = false;

			switch (data.type) {
				case 'error':
					var error = this.player().error();

					error = error || {
						code: -1,
						message: 'cant get error message'
					};
					data.number = error.code;
					data.message = error.message;
					break;
				case 'dispose':
				case 'ended':
					if (data.type === this.oldType) {
						skipped = true;
					}
					data.type = 'stop';
					break;
				case 'loadstart':
					skipped = true;
					break;
				case 'firstplay':
					data.type = 'start';
					this.intervalPing = this.setInterval(this.onPing, Metrics.INTERVAL_PING);
					break;
				case 'waiting':
					data.type = 'buffering';
					break;
				case 'bandwidthIncrease':
				case 'bandwidthDecrease':
					break;
				default:
					break;
			}

			this.oldType = data.type;

			if (skipped) {
				return;
			}

			this.notify(data);
		}
	}, {
		key: 'onPing',
		value: function onPing() {
			this.player().trigger('ping');
		}
	}, {
		key: 'setupTriggers',
		value: function setupTriggers(off) {
			var addOrRemove = off || 'on';

			var events = this.options_.trackEvents;

			var player = this.player();

			var i = events.length - 1;

			for (i; i >= 0; i--) {
				// just call event start only one time
				var firstCall = addOrRemove;

				if (events[i] === 'firstplay' && addOrRemove === 'on') {
					firstCall = 'one';
				}
				player[firstCall](events[i], _videoJs2['default'].bind(this, this.eventHandler));
			}
		}
	}, {
		key: 'pick',
		value: function pick(obj, list, context) {
			var result = {};

			if (typeof list === 'string') {
				list = [list];
			}

			Object.keys(obj).forEach(function (key) {
				if (list.indexOf(key) > -1) {
					result[key] = obj[key];
				}
			}, context);

			return result;
		}
	}, {
		key: 'getRequiredKeys',
		value: function getRequiredKeys(type) {
			return Metrics.BASE_KEYS.concat(Metrics.REQUIRED_KEY[type] || []);
		}
	}, {
		key: 'notify',
		value: function notify(evt) {
			var player = this.player();

			var width = _globalWindow2['default'].innerWidth || _globalDocument2['default'].documentElement.clientWidth || _globalDocument2['default'].body.clientWidth;

			var height = _globalWindow2['default'].innerHeight || _globalDocument2['default'].documentElement.clientHeight || _globalDocument2['default'].body.clientHeight;

			// Merge with default options
			evt['user_id'] = this.options().user_id;
			evt['fqdn'] = this.pathUrl[1];
			evt['os'] = this.browserInfo.os;
			evt['os_version'] = this.browserInfo.osVersion.toString();
			evt['web_browser'] = this.browserInfo.browser.toString();
			evt['web_browser_version'] = this.browserInfo.version ? this.browserInfo.version.toString() : '';
			evt['resolution_size'] = width + 'x' + height;
			evt['flash_version'] = Flash.version().join(',');
			evt['html5_video'] = player.techName_ ? player.techName_ !== 'FLash' || player.techName_ !== 'DashAs' : 'undefined';
			evt['relative_url'] = this.pathUrl[2];
			evt['timeout'] = false;
			evt['frames_dropped'] = 0;
			try {
				var metrics = player.techGet_('getPlaybackStatistics');

				this.metrics_ = _videoJs2['default'].util.mergeOptions(this.metrics_, metrics);
				evt['video_bitrate'] = this.metrics_.video.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.video.bandwidth / 1000)) : -1;
				evt['audio_bitrate'] = this.metrics_.audio.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.audio.bandwidth / 1000)) : -1;
				evt['chunks_from_cdn'] = this.metrics_.p2pweb.chunksFromCDN;
				evt['chunks_from_p2p'] = this.metrics_.p2pweb.chunksFromP2P;
				evt['startup_time'] = this.metrics_.p2pweb.startupTime;

				var pickedData = Metrics.pick(evt, this.getRequiredKeys(evt.type));

				this.xhr(this.options(), pickedData);
			} catch (e) {
				_videoJs2['default'].log(e);
			}
		}
	}]);

	return Metrics;
})(Component);

Metrics.REQUIRED_KEY = {
	'bandwidthIncrease': ['video_bitrate', 'audio_bitrate'],
	'bandwidthDecrease': ['video_bitrate', 'audio_bitrate'],
	'ping': ['chunks_from_cdn', 'chunks_from_p2p'],
	'buffering': [],
	'error': ['number', 'message'],
	'start': ['video_bitrate', 'audio_bitrate', 'os', 'os_version', 'web_browser', 'web_browser_version', 'resolution_size', 'flash_version', 'html5_video', 'relative_url'],
	'stop': ['timeout', 'frames_dropped']
};

Metrics.URL_MATCH = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b)*(\/[\/\d\w\.-]*)*(?:[\?])*(.+)*/;

Metrics.prototype.pathUrl = '';
Metrics.prototype.oldType = null;
Metrics.prototype.intervalPing = 0;
Metrics.prototype.browserInfo = {};

Metrics.prototype.options_ = {
	'option': true,
	'user_id': 666,
	'method': 'POST',
	'responseType': 'json',
	'timeout': 1000,
	'url': '//stats.afrostream.tv/api/v1/events',
	'trackEvents': ['loadstart', 'ping', 'firstplay', 'ended', 'dispose', 'waiting', 'error', 'bandwidthIncrease', 'bandwidthDecrease']
};

Metrics.INTERVAL_PING = 60000;

Metrics.BASE_KEYS = ['user_id', 'type', 'fqdn'];

Metrics.METRICS_DATA = {
	bandwidth: -1,
	bitrateIndex: 0,
	pendingIndex: '',
	numBitrates: 0,
	bufferLength: 0,
	droppedFrames: 0,
	movingLatency: 0,
	movingDownload: 0,
	movingRatio: 0,
	requestsQueue: 0
};

Metrics.prototype.metrics_ = {
	video: _videoJs2['default'].mergeOptions({}, Metrics.METRICS_DATA),
	audio: _videoJs2['default'].mergeOptions({}, Metrics.METRICS_DATA)
};

Metrics.xhr = _xhr2['default'];

Component.registerComponent('Metrics', Metrics);

// register the plugin
_videoJs2['default'].options.children.metrics = {};