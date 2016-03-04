import window from 'global/window';
import QUnit from 'qunit';
import metricsMaker from '../src/metrics';
import playerProxy from './player-proxy';

QUnit.module('metrics', {

	beforeEach() {
		this.oldTimeout = window.setTimeout;
		window.setTimeout = Function.prototype;
	},

	afterEach() {
		window.setTimeout = this.oldTimeout;
	}
});

QUnit.test(
	'metricsMaker takes a player and returns a metrics',
	function (assert) {
		let metrics = metricsMaker(playerProxy(), {});

		assert.equal(typeof metrics, 'object', 'metrics is an object');
	}
);


QUnit.test(
	'triger metrics',
	function (assert) {
		let xhr = this.sandbox.useFakeXMLHttpRequest();
		let requests = this.requests = [];

		let player = playerProxy();

		let metrics = metricsMaker(player, {});

		player.currentSrc = function () {
			return 'http://vjs.zencdn.net/v/oceans.mp4';
		};

		player.trigger('loadstart');

		assert.equal(requests.length(), 0, 'new currentItem is 0');

		player.trigger('firstplay');

		assert.equal(requests.length(), 1, 'new currentItem is 1');
	}
);
