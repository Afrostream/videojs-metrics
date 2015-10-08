/*! videojs-metrics - v0.0.0 - 2015-10-08
* Copyright (c) 2015 benjipott; Licensed Apache-2.0 */
/*! videojs-metrics - v0.0.0 - 2015-10-7
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license. */
(function (window, videojs) {
  'use strict';

  var defaults = {
      'option': true,
      'user_id': '',
      'method': 'POST',
      'responseType': 'json',
      'timeout': 1000,
      'url': '//stats.afrostream.tv/api/v1/events',
      'trackEvents': ['firstplay', 'ended', 'waiting', 'error', 'bitratechange', 'dispose']
    },
    metrics, getBrowser;
  /**
   * Get browser infos
   * @returns {{}}
   */
  getBrowser = function () {
    var data = {};
    var browser = null;
    var version = null;
    var os = null;
    var parseUserAgent, prepareData, renameOsx, cutSafariVersion;

    parseUserAgent = function () {
      var userAgent = navigator.userAgent.toLowerCase(),
        browserParts = /(ie|firefox|chrome|safari|opera)(?:.*version)?(?:[ \/])?([\w.]+)/.exec(userAgent),
        osParts = /(mac|win|linux|freebsd|mobile|iphone|ipod|ipad|android|blackberry|j2me|webtv)/.exec(userAgent);

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
    };

    prepareData = function () {
      data.browser = browser;
      data.version = parseInt(version, 10) || null;
      data.os = os;
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

  var BASE_KEYS = ['user_id', 'type', 'fqdn'];
  var REQUIRED_KEY = {
    'bandwidthIncrease': ['video_bitrate', 'audio_bitrate'],
    'bandwidthDecrease': ['video_bitrate', 'audio_bitrate'],
    'buffering': [],
    'error': ['number', 'message'],
    'start': ['os', 'os_version', 'web_browser', 'web_browser_version', 'resolution_size', 'flash_version', 'html5_video', 'relative_url'],
    'stop': ['timeout', 'frames_dropped']
  };

  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  metrics = function (options) {
    var settings = videojs.util.mergeOptions(defaults, options),
      player = this, setupTriggers, eventHandler, notify, xhr, pick, getRequiredKeys, browserInfo = getBrowser(),
      urlMatch = /https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b)*(\/[\/\d\w\.-]*)*(?:[\?])*(.+)*/gi,
      path = urlMatch.exec(player.currentSrc());

    settings.user_id = settings.user_id || 666;

    eventHandler = function (evt) {
      var data = {
        type: evt.type
      };

      switch (data.type) {
        case 'ended':
          data.type = 'stop';
          break;
        case 'firstplay':
          data.type = 'start';
          break;
        case 'waiting':
          data.type = 'buffering';
          break;
        default:
          break;
      }

      notify(data);

    };

    setupTriggers = function () {
      for (var i = settings.trackEvents.length - 1; i >= 0; i--) {
        player.on(settings.trackEvents[i], videojs.bind(this, eventHandler));
      }
    };

    pick = function (obj, list, context) {
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

    getRequiredKeys = function (type) {
      return BASE_KEYS.concat(REQUIRED_KEY[type] || []);
    };

    notify = function (evt) {
      // Merge with default options
      evt.user_id = settings.user_id;
      evt.fqdn = path[1];
      evt.os = browserInfo.os;
      evt.os_version = browserInfo.version.toString();
      evt.web_browser = browserInfo.browser;
      evt.web_browser_version = browserInfo.web_browser_version;
      evt.resolution_size = screen.width + 'x' + screen.height;
      evt.flash_version = videojs.Flash.version().join(',');
      evt.html5_video = player.techName === 'html5';
      evt.relative_url = path[2];
      evt.timeout = false;
      evt.frames_dropped = 0;
      var pickedData = pick(evt, getRequiredKeys(evt.type));

      xhr(settings, pickedData);
    };

    xhr = function (url, data, callback) {
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
      //request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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

    setupTriggers();
  };

  // register the plugin
  videojs.plugin('metrics', metrics);
})(window, window.videojs);
