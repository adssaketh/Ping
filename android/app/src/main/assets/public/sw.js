/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "03b086b8304923a97e0165de26faeb00"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e32a61975d568bda9b2d0959da6aca0a"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a9da5e63c185c2a9d4e6f44b05b28940"
  }, {
    "url": "ping-icon.png",
    "revision": "e32a61975d568bda9b2d0959da6aca0a"
  }, {
    "url": "index.html",
    "revision": "5c12c8da51bec6973ff4dd5c2b4bfd49"
  }, {
    "url": "icon.svg",
    "revision": "f404d3e48a9059ccc0e5bdf6f6543b0a"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "98370fe587941211642584aacc68d828"
  }, {
    "url": "assets/rotate-ccw-D9auZ2Mo.js",
    "revision": null
  }, {
    "url": "assets/motion-C9sNGaBY.js",
    "revision": null
  }, {
    "url": "assets/index-DoVWBViw.css",
    "revision": null
  }, {
    "url": "assets/index-D8BoJ4JR.js",
    "revision": null
  }, {
    "url": "assets/SettingsModal-BlGiNpPA.js",
    "revision": null
  }, {
    "url": "assets/ProfilePhotoEditor-DZeRVKqo.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPolicyModal-DSDqPghq.js",
    "revision": null
  }, {
    "url": "assets/NewChatModal-DX1-T6BK.js",
    "revision": null
  }, {
    "url": "assets/CreditsModal-DZWv6i8Y.js",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_20261020_172005_885679d0.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "98370fe587941211642584aacc68d828"
  }, {
    "url": "icon.svg",
    "revision": "f404d3e48a9059ccc0e5bdf6f6543b0a"
  }, {
    "url": "ping-icon.png",
    "revision": "e32a61975d568bda9b2d0959da6aca0a"
  }, {
    "url": "pwa-192x192.png",
    "revision": "a9da5e63c185c2a9d4e6f44b05b28940"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e32a61975d568bda9b2d0959da6aca0a"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "03b086b8304923a97e0165de26faeb00"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6f4ce14d6ed725db03b39aeefe4a35e8"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
