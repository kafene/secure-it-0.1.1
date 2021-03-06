/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Ci } = require('chrome');
const { List, addListItem, removeListItem } = require('sdk/util/list');
const { ns } = require('sdk/core/namespace');
const { Class } = require('sdk/core/heritage');
const { Disposable } = require('sdk/core/disposable');
const { newURI } = require('sdk/url/utils');

const events = require('./connection/events');

const REDIRECTS = List();
const requestNS = ns();

function onRequest({ subject }) {
  let channel = subject.QueryInterface(Ci.nsIHttpChannel);
  for each (let redirect in REDIRECTS)
    if (applyRedirect(redirect, channel))
      break;
  return;
}
events.on('modify-request', onRequest);

const Redirect = Class({
  implements: [ Disposable ],
  initialize: function(details) {
    if (details.to)
    	details.to = newURI(details.to.toString());
    requestNS(this).details = details;

    addListItem(REDIRECTS, this);
  },
  dispose: function() {
    removeListItem(REDIRECTS, this);
  },
  get from() requestNS(this).details.from,
  get to() requestNS(this).details.to.spec
});
exports.Redirect = Redirect;

function applyRedirect(redirect, channel) {
  let url = channel.URI.spec;
  let { from, to, secure } = requestNS(redirect).details;

  if (secure && typeof to == 'undefined') {
    to = newURI(url.replace(/^https?:/i, 'https:'));
  }

  if ('test' in from) {
    if (from.test(url)) {
    	channel.redirectTo(to);
      return true;
    }
  }
  else if (url == from) {
  	channel.redirectTo(to);
    return true;
  }
  return false;
}
