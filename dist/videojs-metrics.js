/*! videojs-metrics - v0.0.0 - 2015-10-07
* Copyright (c) 2015 benjipott; Licensed Apache-2.0 */
/*! videojs-metrics - v0.0.0 - 2015-10-7
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license. */
(function (window, videojs) {
  'use strict';

  var defaults = {
      option: true,
      trackEvents: ['start', 'ended', 'waiting', 'error', 'bitratechange']
    },
    metrics;

  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  metrics = function (options) {
    var settings = videojs.util.mergeOptions(defaults, options),
      player = this, setupTriggers, eventHandler;

    setupTriggers = function () {
      for (var i = options.trackEvents.length - 1; i >= 0; i--) {
        player.on(options.trackEvents[i], this.eventHandler);
      }
    };

    eventHandler = function (evt) {
      var eventType = event.type;
      switch (eventType) {
        case 'ended':
          eventType = 'stop';
          break;
        case 'waiting':
          eventType = 'buffering';
          break;
        default:
          break;
      }
      
    };

  };

  // register the plugin
  videojs.plugin('metrics', metrics);
})(window, window.videojs);
