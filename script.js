extractHostname = (url) => {
  let hostname = url.indexOf("//") > -1 ? url.split('/')[2] : url.split('/')[0];

  // find & remove port number
  hostname = hostname.split(':')[0];
  // find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
};

setByteLengthPerOrigin = async (origin, byteLength) => {
  const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
  const stats = await LS.getItem('stats');
  const statsJson = undefined === stats ? {} : JSON.parse(stats);
  
  let bytePerOrigin = undefined === statsJson[origin] ? 0 : parseInt(statsJson[origin]);
  statsJson[origin] = bytePerOrigin + byteLength;
  chrome.storage.local.set({['stats']: JSON.stringify(statsJson)});
  /*
  chrome.tabs.query({active: true}, async function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {co2: statsJson, duration: await LS.getItem('duration')}, function(response) {});
  });
  */
};

isChrome = () => {
  return (typeof(browser) === 'undefined');
};

headersReceivedListener = (requestDetails) => {
  if (isChrome()) {
     const origin = extractHostname(!requestDetails.initiator ? requestDetails.url : requestDetails.initiator);
     const responseHeadersContentLength = requestDetails.responseHeaders.find(element => element.name.toLowerCase() === "content-length");
     const contentLength = undefined === responseHeadersContentLength ? {value: 0}
      : responseHeadersContentLength;
     const requestSize = parseInt(contentLength.value, 10);
     setByteLengthPerOrigin(origin, requestSize);

     return {};
  }

  let filter = browser.webRequest.filterResponseData(requestDetails.requestId);

  filter.ondata = event => {
    const origin = extractHostname(!requestDetails.originUrl ? requestDetails.url : requestDetails.originUrl);
    setByteLengthPerOrigin(origin, event.data.byteLength);

    filter.write(event.data);
  };

  filter.onstop = () => {
    filter.disconnect();
  };

  return {};
};

setBrowserIcon = (type) => {
  chrome.action.setIcon({path: `icons/icon-${type}-48.png`});
};

addOneMinute = async () => {
  const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
  
  let duration = await LS.getItem('duration');
  duration = undefined === duration ? 1 : 1 * duration + 1; //LOL?
  LS.setItem('duration', duration);
};

let addOneMinuteInterval;

handleMessage = (request) => {
  const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };

  if ('stop' === request.action) { // only stop when browser is openned. If restarted, the extension starts again
    LS.setItem('stop', true);
    setBrowserIcon('off');
    chrome.webRequest.onHeadersReceived.removeListener(headersReceivedListener);

    if (addOneMinuteInterval) {
      clearInterval(addOneMinuteInterval);
      addOneMinuteInterval = null;
    }
  }
};

chrome.runtime.onMessage.addListener(handleMessage);


setBrowserIcon('on');
chrome.webRequest.onHeadersReceived.addListener(
  headersReceivedListener,
  {urls: ['<all_urls>']},
  ['responseHeaders']
);

if (!addOneMinuteInterval) {
  addOneMinuteInterval = setInterval(addOneMinute, 60000);
}
