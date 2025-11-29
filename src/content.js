(() => {
  'use strict';
  if (window.top !== window) return;

  const ID = 'metacrypt-floating-btns';
  if (document.getElementById(ID)) return;

  const div = document.createElement('div');
  div.id = ID;
  div.innerHTML = `
    <div style="position:fixed;top:12px;right:12px;z-index:2147483647;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);border-radius:12px;padding:8px;box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:system-ui;">
      <button id="mc-encrypt" title="Encrypt selected text" style="background:#28a745;color:white;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;">Encrypt</button>
      <button id="mc-decrypt" title="Decrypt selected text/file" style="background:#ffc107;color:black;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;margin-left:6px;">Decrypt</button>
    </div>
  `;
  document.body.appendChild(div);

  document.getElementById('mc-encrypt').onclick = () => {
    const sel = window.getSelection().toString().trim();
    if (sel) chrome.runtime.sendMessage({ type: 'ENCRYPT_SELECTION', text: sel });
  };

  document.getElementById('mc-decrypt').onclick = () => {
    const sel = window.getSelection().toString().trim();
    if (sel) chrome.runtime.sendMessage({ type: 'DECRYPT_SELECTION', text: sel });
  };
})();