'use strict';

if (typeof openpgp === 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-error').style.display = 'block';
    document.body.style.opacity = '0.6';
  });
} else {
  let publicKeys = new Map();
  let privateKey = null;
  let attachedFile = null;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('load-error').style.display = 'none';
    setupEventListeners();
    await loadStoredKeys();
  });

  function setupEventListeners() {
    document.getElementById('addPubKeyBtn').onclick = addPublicKey;
    document.getElementById('addPrivKeyBtn').onclick = addPrivateKey;
    document.getElementById('encryptBtn').onclick = encryptText;
    document.getElementById('decryptBtn').onclick = decryptText;
    document.getElementById('encryptFileBtn').onclick = encryptFile;

    const zone = document.getElementById('drop-zone');
    zone.onclick = () => document.getElementById('file-input').click();
    document.getElementById('file-input').onchange = e => e.target.files[0] && handleFile(e.target.files[0]);

    ['dragover', 'dragenter'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('highlight'); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('highlight'); }));
    zone.ondrop = e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  }

  function showStatus(msg, error = false) {
    const el = document.getElementById('status');
    el.innerHTML = `<div class="${error ? 'error' : 'success'}">${msg}</div>`;
    setTimeout(() => el.innerHTML = '', 6000);
  }

  async function addPublicKey() {
    const armored = document.getElementById('pubkey').value.trim();
    if (!armored) return showStatus('Paste a public key', true);
    try {
      const key = await openpgp.readKey({ armoredKey: armored });
      const fp = (await key.getFingerprint()).toUpperCase();
      publicKeys.set(fp, key);
      await chrome.storage.sync.set({ [`pub_${fp}`]: armored });
      showStatus(`Public key added: ...${fp.slice(-8)}`);
      document.getElementById('pubkey').value = '';
    } catch { showStatus('Invalid public key', true); }
  }

  async function addPrivateKey() {
    const armored = document.getElementById('privkey').value.trim();
    if (!armored) return showStatus('Paste your private key', true);
    try {
      privateKey = await openpgp.readPrivateKey({ armoredKey: armored });
      await chrome.storage.sync.set({ privateKey: armored });
      showStatus('Private key imported');
      document.getElementById('privkey').value = '';
    } catch { showStatus('Invalid private key', true); }
  }

  async function encryptText() {
    const text = document.getElementById('message').value.trim();
    if (!text || publicKeys.size === 0) return showStatus('Add key + message', true);
    try {
      const msg = await openpgp.createMessage({ text });
      const encrypted = await openpgp.encrypt({ message: msg, encryptionKeys: [...publicKeys.values()], format: 'armored' });
      document.getElementById('result').value = encrypted;
      showStatus('Message encrypted');
    } catch { showStatus('Encryption failed', true); }
  }

  async function encryptFile() {
    if (!attachedFile || publicKeys.size === 0) return;
    if (attachedFile.size > MAX_FILE_SIZE) return showStatus('File too large (>10 MB)', true);

    try {
      const data = new Uint8Array(await attachedFile.arrayBuffer());
      const header = new TextEncoder().encode(JSON.stringify({ n: attachedFile.name, t: attachedFile.type || 'application/octet-stream' }));
      const container = new Uint8Array(header.length + 1 + data.length);
      container.set(header); container[header.length] = 0; container.set(data, header.length + 1);

      const msg = await openpgp.createMessage({ binary: container });
      const encrypted = await openpgp.encrypt({ message: msg, encryptionKeys: [...publicKeys.values()], format: 'armored' });

      document.getElementById('result').value = encrypted;
      showStatus('File encrypted — metadata hidden');
      attachedFile = null; document.getElementById('file-name').textContent = ''; document.getElementById('encryptFileBtn').disabled = true;
    } catch { showStatus('File encryption failed', true); }
  }

  async function decryptText() {
    const armored = document.getElementById('message').value.trim();
    if (!armored || !privateKey) return showStatus('Import private key first', true);
    try {
      const msg = await openpgp.readMessage({ armoredMessage: armored });
      const { data } = await openpgp.decrypt({ message: msg, decryptionKeys: privateKey, format: 'binary' });

      if (data instanceof Uint8Array && data[0] === 123) { // '{'
        const sep = data.indexOf(0);
        if (sep > 10) {
          try {
            const header = JSON.parse(new TextDecoder().decode(data.slice(0, sep)));
            const blob = new Blob([data.slice(sep + 1)], { type: header.t });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = header.n; a.click();
            URL.revokeObjectURL(url);
            document.getElementById('result').value = `[File decrypted: ${header.n}]`;
            showStatus(`File restored: ${header.n}`);
            return;
          } catch {}
        }
      }

      document.getElementById('result').value = new TextDecoder().decode(data);
      showStatus('Message decrypted');
    } catch { showStatus('Decryption failed', true); }
  }

  function handleFile(file) {
    if (file.size > MAX_FILE_SIZE) return showStatus('File too large (>10 MB)', true);
    attachedFile = file;
    document.getElementById('file-name').textContent = `Selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    document.getElementById('encryptFileBtn').disabled = false;
  }

  async function loadStoredKeys() {
    const data = await chrome.storage.sync.get(null);
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('pub_') && typeof v === 'string') {
        try {
          const key = await openpgp.readKey({ armoredKey: v });
          const fp = (await key.getFingerprint()).toUpperCase();
          publicKeys.set(fp, key);
        } catch {}
      }
      if (k === 'privateKey' && typeof v === 'string') {
        try { privateKey = await openpgp.readPrivateKey({ armoredKey: v }); } catch {}
      }
    }
    if (publicKeys.size > 0) showStatus(`${publicKeys.size} public key(s) loaded`);
  }
}