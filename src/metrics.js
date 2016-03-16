/**
 * ! videojs-metrics - v0.0.0 - 2016-02-15
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license.
 * @file videojs-metrics.js
 **/
import videojs from 'video.js';
import xhr from 'xhr';
import window from 'global/window';
import document from 'global/document';
import * as browser from './utils.js';

let Component = videojs.getComponent('Component');
let Flash = videojs.getComponent('Flash');

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
class Metrics extends Component {
	constructor(player, options) {
		super(player, options);
		let source = this.player().manifestUrl || this.player().currentSrc();

		this.browserInfo = browser.getBrowser();
		this.pathUrl = source.match(Metrics.URL_MATCH) || ['undefined', 'undefined'];
		this.setupTriggers();
	}

	dispose() {
		this.clearInterval(this.intervalPing);
		this.setupTriggers('off');
	}

	eventHandler(evt) {
		let data = {
			type: evt.type
		};

		let skipped = false;

		switch (data.type) {
		case 'error':
			let error = this.player().error();

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

	onPing() {
		this.player().trigger('ping');
	}

	setupTriggers(off) {
		let addOrRemove = off || 'on';

		let events = this.options_.trackEvents;

		let player = this.player();

		let i = events.length - 1

		for (i; i >= 0; i--) {
			// just call event start only one time
			let firstCall = addOrRemove;

			if (events[i] === 'firstplay' && addOrRemove === 'on') {
				firstCall = 'one';
			}
			player[firstCall](events[i], videojs.bind(this, this.eventHandler));
		}
	}

	pick(obj, list, context) {
		let result = {};

		if (typeof list === 'string') {
			list = [list];
		}

		Object.keys(obj)
			.forEach(function (key) {
				if (list.indexOf(key) > -1) {
					result[key] = obj[key];
				}
			}, context);

		return result;
	}

	getRequiredKeys(type) {
		return Metrics.BASE_KEYS.concat(Metrics.REQUIRED_KEY[type] || []);
	}

	notify(evt) {
		let player = this.player();

		let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

		let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		// Merge with default options
		evt['user_id'] = this.options().user_id;
		evt['fqdn'] = this.pathUrl[1];
		evt['os'] = this.browserInfo.os;
		evt['os_version'] = this.browserInfo.osVersion.toString();
		evt['web_browser'] = this.browserInfo.browser.toString();
		evt['web_browser_version'] = this.browserInfo.version ? this.browserInfo.version.toString() : '';
		evt['resolution_size'] = width + 'x' + height;
		evt['flash_version'] = Flash.version().join(',');
		evt['html5_video'] = player.techName_ ? (player.techName_ !== 'FLash' || player.techName_ !== 'DashAs') : 'undefined';
		evt['relative_url'] = this.pathUrl[2];
		evt['timeout'] = false;
		evt['frames_dropped'] = 0;
		try {
			let metrics = player.techGet_('getPlaybackStatistics');

			this.metrics_ = videojs.mergeOptions(this.metrics_, metrics);
			evt['video_bitrate'] = this.metrics_.video.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.video.bandwidth / 1000)) : -1;
			evt['audio_bitrate'] = this.metrics_.audio.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.audio.bandwidth / 1000)) : -1;
			evt['chunks_from_cdn'] = this.metrics_.p2pweb.chunksFromCDN;
			evt['chunks_from_p2p'] = this.metrics_.p2pweb.chunksFromP2P;
			evt['startup_time'] = this.metrics_.p2pweb.startupTime;

			let pickedData = this.pick(evt, this.getRequiredKeys(evt.type));

			Metrics.xhr(this.options(), pickedData);
		}
		catch (e) {
			videojs.log(e);
		}
	}

}


Metrics.REQUIRED_KEY = {
	'bandwidthIncrease': ['video_bitrate', 'audio_bitrate'],
	'bandwidthDecrease': ['video_bitrate', 'audio_bitrate'],
	'ping': ['chunks_from_cdn', 'chunks_from_p2p'],
	'buffering': [],
	'error': ['number', 'message'],
	'start': [
		'video_bitrate',
		'audio_bitrate',
		'os',
		'os_version',
		'web_browser',
		'web_browser_version',
		'resolution_size',
		'flash_version',
		'html5_video',
		'relative_url'],
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
	video: videojs.mergeOptions({}, Metrics.METRICS_DATA),
	audio: videojs.mergeOptions({}, Metrics.METRICS_DATA)
};

Metrics.xhr = xhr;

Component.registerComponent('Metrics', Metrics);

// register the plugin
videojs.options.children.metrics = {};

