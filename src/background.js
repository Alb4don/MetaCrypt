'use strict';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENCRYPT_SELECTION' || message.type === 'DECRYPT_SELECTION') {
    chrome.tabs.sendMessage(sender.tab.id, message);
  }
  return false;
});