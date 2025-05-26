document.getElementById('openCompare').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("compare.html") });
});