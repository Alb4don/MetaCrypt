
# How simple it is

- Message content ***(OpenPGP, properly implemented)***
- File contents and original filenames ***(yes, even the filename is hidden)***
- No plaintext ever touches X or Meta’s servers
- Keys never leave your browser
- Load the extension (unpacked, five seconds)
- Open the popup once, paste your private key and the recipient’s public key
- Close the popup forever the floating buttons now just work

That’s it. Everything after that is one-click.

# Security

- Manifest V3, strict CSP, no inline scripts, no unsafe-eval
- OpenPGP.js v6 runs entirely in the browser zero network calls after load
- Private keys stored only in chrome.storage.sync ***(syncs across your devices, still encrypted by your Google account if you use one)***
- File containers use a deliberately minimal custom envelope JSON header, null byte, raw bytes encrypted as binary
- All inputs length-checked, all errors caught, all object URLs revoked immediately

# Current trade-offs 

- Only one active recipient key at a time (keeps the UI humane; I’ll add multi-recipient when it doesn’t hurt usability)
- Private key lives in browser storage if you need air-gapped keys, ***use a YubiKey + gpg-agent instead***
- 10 MB file limit  armored PGP inflates size ~33%, and most chat apps choke above that anyway

# Installing

- Clone or download this repo
- Put openpgp.min.js (official release) in the root folder
- Access ***chrome://extensions → Enable Developer mode → Load unpacked → select the folder***

You’ll see the buttons appear instantly on x.com and web.whatsapp.com.
