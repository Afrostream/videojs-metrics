/*! videojs-metrics - v0.0.0 - 2016-03-04
* Copyright (c) 2016 benjipott; Licensed Apache-2.0 */
/*! videojs-metrics - v0.0.0 - 2015-10-7
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license. */
(function (window, videojs) {
  'use strict';

  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  videojs.Metrics = videojs.Component.extend({
    init: function (player, options) {
      videojs.Component.call(this, player, options);
      this.browserInfo = videojs.Metrics.getBrowser();
      var source = this.player().manifestUrl || this.player().currentSrc();
      this.pathUrl = source.match(videojs.Metrics.URL_MATCH) || ['undefined', 'undefined'];
      this.setupTriggers();
    }
  });

  videojs.Metrics.prototype.options_ = {
    'option': true,
    'user_id': 666,
    'method': 'POST',
    'responseType': 'json',
    'timeout': 1000,
    'url': '//stats.afrostream.tv/api/v1/events',
    'trackEvents': ['loadstart', 'ping', 'firstplay', 'ended', 'dispose', 'waiting', 'error', 'bandwidthIncrease', 'bandwidthDecrease']
  };
  /**
   * Get browser infos
   * @returns {{}}
   */
  videojs.Metrics.getBrowser = function () {
    var data = {};
    var browser = '';
    var version = '';
    var os = '';
    var osVersion = '';
    var parseUserAgent, prepareData, renameOsx, cutSafariVersion;

    parseUserAgent = function () {
      var userAgent    = navigator.userAgent.toLowerCase(),
          browserParts = /(ie|firefox|chrome|safari|opera)(?:.*version)?(?:[ \/])?([\w.]+)/.exec(userAgent),
          osParts      = /(mac|win|linux|freebsd|mobile|iphone|ipod|ipad|android|blackberry|j2me|webtv)/.exec(userAgent);

      if (!!userAgent.match(/trident\/7\./)) {
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
  };

  videojs.Metrics.INTERVAL_PING = 60000;

  videojs.Metrics.BASE_KEYS = ['user_id', 'type', 'fqdn'];

  videojs.Metrics.METRICS_DATA = {
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

  videojs.Metrics.prototype.metrics_ = {
    video: videojs.util.mergeOptions({}, videojs.Metrics.METRICS_DATA),
    audio: videojs.util.mergeOptions({}, videojs.Metrics.METRICS_DATA)
  };

  videojs.Metrics.REQUIRED_KEY = {
    'bandwidthIncrease': ['video_bitrate', 'audio_bitrate'],
    'bandwidthDecrease': ['video_bitrate', 'audio_bitrate'],
    'ping': ['chunks_from_cdn', 'chunks_from_p2p'],
    'buffering': [],
    'error': ['number', 'message'],
    'start': ['video_bitrate', 'audio_bitrate', 'os', 'os_version', 'web_browser', 'web_browser_version', 'resolution_size', 'flash_version', 'html5_video', 'relative_url'],
    'stop': ['timeout', 'frames_dropped']
  };

  videojs.Metrics.URL_MATCH = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b)*(\/[\/\d\w\.-]*)*(?:[\?])*(.+)*/;

  videojs.Metrics.prototype.pathUrl = '';
  videojs.Metrics.prototype.oldType = null;
  videojs.Metrics.prototype.intervalPing = 0;
  videojs.Metrics.prototype.browserInfo = {};

  videojs.Metrics.prototype.dispose = function () {
    this.clearInterval(this.intervalPing);
    this.setupTriggers('off');
  };

  videojs.Metrics.prototype.eventHandler = function (evt) {
    var data   = {
      type: evt.type
    }, skipped = false;

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
      this.intervalPing = this.setInterval(this.onPing, videojs.Metrics.INTERVAL_PING);
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

  };

  videojs.Metrics.prototype.onPing = function () {
    this.player().trigger('ping');
  };

  videojs.Metrics.prototype.setupTriggers = function (off) {
    var addOrRemove = off || 'on';
    var events = this.options_.trackEvents;
    var player = this.player();
    for (var i = events.length - 1; i >= 0; i--) {
      //just call event start only one time
      var firstCall = addOrRemove;
      if (events[i] === 'firstplay' && addOrRemove === 'on') {
        firstCall = 'one';
      }
      player[firstCall](events[i], videojs.bind(this, this.eventHandler));
    }
  };

  videojs.Metrics.pick = function (obj, list, context) {
    var result = {};

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
  };

  videojs.Metrics.prototype.getRequiredKeys = function (type) {
    return videojs.Metrics.BASE_KEYS.concat(videojs.Metrics.REQUIRED_KEY[type] || []);
  };


  videojs.Metrics.prototype.notify = function (evt) {
    var player = this.player();
    // Merge with default options
    evt.user_id = this.options().user_id;
    evt.fqdn = this.pathUrl[1];
    evt.os = this.browserInfo.os;
    evt.os_version = this.browserInfo.osVersion.toString();
    evt.web_browser = this.browserInfo.browser.toString();
    evt.web_browser_version = this.browserInfo.version ? this.browserInfo.version.toString() : '';
    evt.resolution_size = screen.width + 'x' + screen.height;
    evt.flash_version = videojs.Flash.version().join(',');
    evt.html5_video = player.tech ? player.tech.el().nodeName === 'VIDEO' : 'undefined';//player.techName === 'Html5';
    evt.relative_url = this.pathUrl[2];
    evt.timeout = false;
    evt.frames_dropped = 0;
    //=== BITDASH
    //bandwidth
    //bitrateIndex
    //pend
    // ingIndex
    //numBitrates
    //bufferLength
    //droppedFrames
    //movingLatency
    //movingDownload
    //movingRatio
    //requestsQueue
    //=== CASTLAB
    // ???
    try {
      var metrics = player.techGet('getPlaybackStatistics');
      this.metrics_ = videojs.util.mergeOptions(this.metrics_, metrics);
      evt.video_bitrate = this.metrics_.video.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.video.bandwidth / 1000)) : -1;
      evt.audio_bitrate = this.metrics_.audio.bandwidth > 0 ? Math.max(-1, Math.round(this.metrics_.audio.bandwidth / 1000)) : -1;
      evt.chunks_from_cdn = this.metrics_.p2pweb.chunksFromCDN;
      evt.chunks_from_p2p = this.metrics_.p2pweb.chunksFromP2P;
      evt.startup_time = this.metrics_.p2pweb.startupTime;
      var pickedData = videojs.Metrics.pick(evt, this.getRequiredKeys(evt.type));
      this.xhr(this.options(), pickedData);
    }
    catch (e) {
      videojs.log(e);
    }
  };

  videojs.Metrics.prototype.xhr = function (url, data, callback) {
    var
      options = {
        method: 'GET',
        timeout: 45 * 1000
      },
      request,
      abortTimeout;

    if (typeof callback !== 'function') {
      callback = function () {
      };
    }

    if (typeof url === 'object') {
      options = videojs.util.mergeOptions(options, url);
      url = options.url;
    }

    var XHR = window.XMLHttpRequest;

    if (typeof XHR === 'undefined') {
      // Shim XMLHttpRequest for older IEs
      XHR = function () {
        try {
          return new window.ActiveXObject('Msxml2.XMLHTTP.6.0');
        } catch (e) {
        }
        try {
          return new window.ActiveXObject('Msxml2.XMLHTTP.3.0');
        } catch (f) {
        }
        try {
          return new window.ActiveXObject('Msxml2.XMLHTTP');
        } catch (g) {
        }
        throw new Error('This browser does not support XMLHttpRequest.');
      };
    }

    request = new XHR();
    request.open(options.method, url);
    request.url = url;
    request.requestTime = new Date().getTime();
    request.setRequestHeader('Content-Type', 'application/json');
    if (options.responseType) {
      request.responseType = options.responseType;
    }
    if (options.withCredentials) {
      request.withCredentials = true;
    }
    if (options.timeout) {
      abortTimeout = window.setTimeout(function () {
        if (request.readyState !== 4) {
          request.timedout = true;
          request.abort();
        }
      }, options.timeout);
    }

    request.onreadystatechange = function () {
      // wait until the request completes
      if (this.readyState !== 4) {
        return;
      }

      // clear outstanding timeouts
      window.clearTimeout(abortTimeout);

      // request timeout
      if (request.timedout) {
        return callback.call(this, 'timeout', url);
      }

      // request aborted or errored
      if (this.status >= 400 || this.status === 0) {
        return callback.call(this, true, url);
      }

      if (this.response) {
        this.responseTime = new Date().getTime();
        this.roundTripTime = this.responseTime - this.requestTime;
        this.bytesReceived = this.response.byteLength || this.response.length;
        this.bandwidth = Math.floor((this.bytesReceived / this.roundTripTime) * 8 * 1000);
      }

      return callback.call(this, false, url);
    };

    var queryString = '';
    if (typeof data === 'object') {
      for (var paramName in data) {
        queryString += (queryString.length === 0 ? '' : '&') + paramName + '=' + encodeURIComponent(data[paramName]);
      }
    }

    request.send(queryString);
    return request;
  };

  //// register the plugin
  videojs.options.children.metrics = {};

})(window, window.videojs);
