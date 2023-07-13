// send data to content-script
const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};
setInterval(async () => {
    let stats =  await LS.getItem('stats');
    stats = undefined === stats ? {} : JSON.parse(await stats);
    dispatchEvent(new CustomEvent('co2', {detail: stats}));

    let duration = await LS.getItem('duration');
    duration = undefined === duration ? 0 : duration;
    dispatchEvent(new CustomEvent('duration', {detail: duration}));
  }, 1000);
/*
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.co2) {
            dispatchEvent(new CustomEvent('co2', {detail: request.co2}));
        }  
        if (request.duration) {
            dispatchEvent(new CustomEvent('duration', {detail: request.duration}));
        }
    }
);*/