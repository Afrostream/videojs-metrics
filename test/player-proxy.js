import extend from 'node.extend';
import videojs from 'video.js';

const proxy = (props) => {
  let player = extend(true, {}, videojs.EventTarget.prototype, {
    play: Function.prototype,
    paused: Function.prototype,
    ended: Function.prototype,
    poster: Function.prototype,
    src: Function.prototype,
    addRemoteTextTrack: Function.prototype,
    removeRemoteTextTrack: Function.prototype,
    remoteTextTracks: Function.prototype,
    currentSrc: Function.prototype,
    metrics: {
      'option': true,
      'user_id': 666,
      'method': 'POST',
      'responseType': 'json',
      'timeout': 1000,
      'url': '//stats.afrostream.tv/api/v1/events',
      'trackEvents': []
    }
  }, props);

  player.constructor = videojs.getComponent('Player');
  player.metrics.player_ = player;

  return player;
};

export default proxy;
