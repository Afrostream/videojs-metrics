[![Build Status](https://api.travis-ci.org/Afrostream/videojs-metrics.svg?branch=master)](https://travis-ci.org/Afrostream/videojs-metrics)

# Metrics Plugin for video.js

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Inclusion](#inclusion)
- [Basic Usage](#basic-usage)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install videojs-metrics via npm (preferred):

```sh
$ npm install videojs-metrics
```

Or Bower:

```sh
$ bower install videojs-metrics
```

## Inclusion

Include videojs-metrics on your website using the tool(s) of your choice.

The simplest method of inclusion is a `<script>` tag after the video.js `<script>` tag:

```html
<script src="path/to/video.js/dist/video.js"></script>
<script src="path/to/videojs-metrics/dist/videojs-metrics.js"></script>
```

When installed via npm, videojs-metrics supports Browserify-based workflows out of the box.

## Basic Usage

For full details on how to use the playlist plugin can be found in [the API documentation](docs/api.md).

```js
var player = videojs('video');

player.metrics();

```

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
