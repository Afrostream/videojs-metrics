import videojs from 'video.js';
import metrics from './metrics';

/**
 * The video.js playlist plugin. Invokes the playlist-maker to create a
 * playlist function on the specific player.
 *
 * @param {Array} list
 */
const plugin = function (options) {
	metrics(this, options);
};

videojs.plugin('metrics', plugin);

export default plugin;
