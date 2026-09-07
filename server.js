const http = require('http');

const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cafe Setup - Momen.earth</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #eee; min-height: 100vh; padding: 40px 20px; }
.container { max-width: 900px; margin: 0 auto; }
h1 { text-align: center; font-size: 2.5em; margin-bottom: 10px; color: #00d4ff; text-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
.subtitle { text-align: center; color: #888; margin-bottom: 40px; font-size: 1.1em; }
.os-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 40px; }
.os-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 25px; transition: transform 0.3s, box-shadow 0.3s; }
.os-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1); }
.os-icon { font-size: 2.5em; margin-bottom: 15px; }
.os-name { font-size: 1.5em; font-weight: bold; margin-bottom: 15px; color: #fff; }
.command-box { background: #0a0a0a; border: 1px solid #333; border-radius: 8px; padding: 15px; position: relative; overflow: hidden; }
.command-box code { display: block; font-family: 'Courier New', monospace; font-size: 0.9em; color: #00ff88; word-break: break-all; line-height: 1.5; }
.copy-btn { position: absolute; top: 10px; right: 10px; background: #00d4ff; color: #000; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.85em; font-weight: bold; transition: background 0.3s; }
.copy-btn:hover { background: #00a8cc; }
.copy-btn.copied { background: #00ff88; }
.footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.9em; }
.footer a { color: #00d4ff; text-decoration: none; }
.note { background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107; padding: 15px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }
.note p { color: #ffc107; font-size: 0.95em; }
@media (max-width: 600px) { .os-grid { grid-template-columns: 1fr; } h1 { font-size: 1.8em; } .os-card { padding: 20px; } }
</style>
</head>
<body>
<div class="container">
<h1>🚀 Cafe Setup</h1>
<p class="subtitle">Quick setup for cafe.momen.earth - Choose your operating system</p>
<div class="note"><p>⚠️ <strong>Note:</strong> These scripts will connect you to your VPS via SSH. Make sure you have your vault password ready.</p></div>
<div class="os-grid">
<div class="os-card">
<div class="os-icon">🐧</div>
<div class="os-name">Linux / macOS</div>
<div class="command-box">
<button class="copy-btn" onclick="copyCommand(this)">Copy</button>
<code>curl -fsSL https://cafe.momen.earth/cafe.sh | bash</code>
</div>
</div>
<div class="os-card">
<div class="os-icon">🪟</div>
<div class="os-name">Windows (PowerShell)</div>
<div class="command-box">
<button class="copy-btn" onclick="copyCommand(this)">Copy</button>
<code>powershell -NoProfile -ExecutionPolicy Bypass -c "iwr -useb https://cafe.momen.earth/cafe.ps1 | iex"</code>
</div>
</div>
</div>
<div class="footer">
<p>Powered by <a href="https://momen.earth" target="_blank">momen.earth</a> | <a href="https://github.com/AdamMomen/.dotfiles" target="_blank">GitHub</a></p>
</div>
</div>
<script>
function copyCommand(btn) {
  const code = btn.nextElementSibling.textContent;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(err => { console.error('Failed to copy:', err); btn.textContent = 'Failed'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); });
}
</script>
</body>
</html>`;

const bashScript = `#!/usr/bin/env bash
set -euo pipefail

log() { printf '%s\\n' "\$*"; }
err() { printf '%s\\n' "\$*" >&2; }

usage() {
  echo "Usage: curl -fsSL https://cafe.momen.earth/cafe.sh | bash" >&2
}

DRY_RUN="\${DRY_RUN:-0}"

log "[cafe] Minimal bootstrap starting..."

uname_s=\$(uname -s || true)
case "\${uname_s}" in
  Linux|Darwin) : ;;
  MINGW*|MSYS*|CYGWIN*)
    err "[cafe] Detected Windows shell. Use PowerShell:"
    err "  powershell -NoProfile -ExecutionPolicy Bypass -c \\"iwr -useb https://cafe.momen.earth/cafe.ps1 | iex\\""
    exit 1
    ;;
  *) err "[cafe] Unsupported OS: \${uname_s}"; exit 1 ;;
esac

ensure_python() {
  if command -v python3 >/dev/null 2>&1; then return; fi
  err "[cafe] python3 not found. On this kiosk, installing system packages is typically blocked."
  err "[cafe] Options: 1) Use a machine with python3. 2) Connect to your VPS from another host."
  exit 1
}

ensure_ansible() {
  export PATH="\$HOME/.local/bin:\$PATH"
  if ! command -v pipx >/dev/null 2>&1; then
    if command -v python3 >/dev/null 2>&1; then
      python3 -m pip install --user pipx >/dev/null 2>&1 || true
      command -v pipx >/dev/null 2>&1 || python3 -m pip install --user --upgrade pip >/dev/null 2>&1
    fi
  fi
  if command -v pipx >/dev/null 2>&1; then
    command -v ansible-playbook >/dev/null 2>&1 || pipx install --include-deps ansible-core
  else
    python3 -m pip install --user ansible-core
  fi
}

DOTFILES_DIR="\${HOME}/.dotfiles"
VAULT_PASS_FILE="\${VAULT_PASS_FILE:-}"
VAULT_URL_DEFAULT="https://raw.githubusercontent.com/AdamMomen/.dotfiles/refs/heads/master/ansible/vault/ssh_pk.txt"
VAULT_DOWNLOADED=0

fetch_vault() {
  if [[ -f "\${DOTFILES_DIR}/ansible/vault/ssh_pk.txt" ]]; then
    VAULT_FILE="\${DOTFILES_DIR}/ansible/vault/ssh_pk.txt"
    log "[cafe] Using local vault at \${VAULT_FILE}"
    return
  fi
  VAULT_FILE="\$(mktemp -t vault.XXXXXX.txt)"
  log "[cafe] Downloading encrypted vault"
  curl -fsSL "\${VAULT_URL_DEFAULT}" -o "\${VAULT_FILE}"
  VAULT_DOWNLOADED=1
}

decrypt_key_into_agent() {
  if [[ "\${DRY_RUN}" == "1" ]]; then
    log "[cafe] DRY_RUN=1 set. Skipping vault decrypt and ssh-agent."
    return 0
  fi
  local vault_id
  if [[ -n "\${VAULT_PASS_FILE}" && -f "\${VAULT_PASS_FILE}" ]]; then
    vault_id="default@file:\${VAULT_PASS_FILE}"
  else
    vault_id="default@prompt"
  fi
  eval "\$(ssh-agent -s)" >/dev/null
  trap 'ssh-agent -k >/dev/null 2>&1 || true' EXIT
  if ! ansible-vault view --vault-id "\${vault_id}" "\${VAULT_FILE}" | ssh-add - >/dev/null; then
    err "[cafe] Failed to decrypt and load SSH key"
    exit 1
  fi
}

connect_vps() {
  local host="matrix.eveva.ai"
  local user="root"
  if command -v ssh >/dev/null 2>&1; then
    if [[ "\${DRY_RUN}" == "1" ]]; then
      log "[cafe] DRY_RUN=1 set. Would run: ssh -tt \${user}@\${host} 'tmux new -A -s cafe' < /dev/tty"
    else
      log "[cafe] Connecting to \${user}@\${host} (tmux attach/create)"
      if [[ -e /dev/tty ]]; then
        ssh -o IdentitiesOnly=yes -tt "\${user}@\${host}" 'tmux new -A -s cafe' < /dev/tty
      else
        ssh -o IdentitiesOnly=yes -tt "\${user}@\${host}" 'tmux new -A -s cafe'
      fi
    fi
  else
    err "[cafe] ssh client not available. Download a portable SSH client or use another host."
  fi
}

ensure_python
ensure_ansible
fetch_vault
decrypt_key_into_agent
connect_vps

if [[ "\${VAULT_DOWNLOADED}" == "1" && -n "\${VAULT_FILE:-}" && -f "\${VAULT_FILE}" ]]; then
  rm -f "\${VAULT_FILE}"
fi

exit 0
`;

const psScript = `# Windows PowerShell minimal bootstrap
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -c "iwr -useb https://cafe.momen.earth/cafe.ps1 | iex"

\$ErrorActionPreference = 'Stop'

function Write-Log(\$msg) { Write-Host \$msg }
function Write-Err(\$msg) { Write-Error -Message (\$msg | Out-String) }

\$CafeVersion = '0.3.9'
Write-Log "[cafe] Windows bootstrap starting... v\$CafeVersion"
\$DRY_RUN = \$env:DRY_RUN
if (-not \$DRY_RUN) { \$DRY_RUN = '0' }

\$VaultUrlDefault = "https://raw.githubusercontent.com/AdamMomen/.dotfiles/refs/heads/master/ansible/vault/ssh_pk.txt"
\$VaultDownloaded = \$false
\$VaultFile = ""

function Resolve-PythonCommand {
  \$candidates = @(@('python'), @('python3'), @('py', '-3'), @('py'))
  foreach (\$cand in \$candidates) {
    try {
      \$out = & \$cand '-c' 'import sys; print(sys.version)' 2>\$null
      if (\$LASTEXITCODE -eq 0 -and \$out) { return \$cand }
    } catch {}
  }
  return \$null
}

function Confirm-Python {
  \$script:PythonCmd = Resolve-PythonCommand
  if (-not \$script:PythonCmd) { throw "Python missing" }
}

function Confirm-Ansible {
  if (-not \$script:PythonCmd) { \$script:PythonCmd = Resolve-PythonCommand }
  try { & \$script:PythonCmd -m pip install --disable-pip-version-check --user --upgrade pip | Out-Null } catch {}
  try { & \$script:PythonCmd -m pip install --disable-pip-version-check --user ansible-core | Out-Null } catch {}
}

function Get-VaultFile {
  \$localVault = Join-Path \$env:USERPROFILE ".dotfiles/ansible/vault/ssh_pk.txt"
  if (Test-Path \$localVault) { \$script:VaultFile = \$localVault; return }
  \$tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), (New-Guid).ToString() + ".txt")
  Write-Log "[cafe] Downloading encrypted vault"
  Invoke-WebRequest -Uri \$VaultUrlDefault -OutFile \$tmp
  \$script:VaultFile = \$tmp
  \$script:VaultDownloaded = \$true
}

function Connect-VPS {
  \$serverHost = "matrix.eveva.ai"
  \$user = "root"
  \$cmd = "tmux new -A -s cafe"
  if (Get-Command ssh -ErrorAction SilentlyContinue) {
    if (\$DRY_RUN -eq '1') { Write-Log "[cafe] DRY_RUN=1. Would run: ssh -tt \$user@\$serverHost '\$cmd'" }
    else { Write-Log "[cafe] Connecting to \$user@\$serverHost"; ssh -tt "\$user@\$serverHost" "\$cmd" }
  } else { Write-Err "[cafe] ssh not found." }
}

try {
  Confirm-Python
  Confirm-Ansible
  Get-VaultFile
  Connect-VPS
  if (\$VaultDownloaded -and (Test-Path \$VaultFile)) { Remove-Item -Force \$VaultFile }
} catch { Write-Err \$_; exit 1 }
`;

const server = http.createServer((req, res) => {
  const url = req.url;
  
  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlPage);
  } else if (url === '/cafe.sh' || url === '/bash') {
    res.writeHead(200, { 
      'Content-Type': 'text/x-shellscript',
      'Content-Disposition': 'attachment; filename="cafe.sh"'
    });
    res.end(bashScript);
  } else if (url === '/cafe.ps1' || url === '/windows') {
    res.writeHead(200, { 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="cafe.ps1"'
    });
    res.end(psScript);
  } else if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'cafe-setup' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 Cafe Setup Server running on port ' + PORT);
  console.log('📍 Routes:');
  console.log('   GET /         - HTML setup page');
  console.log('   GET /cafe.sh  - Bash script (Linux/macOS)');
  console.log('   GET /bash     - Bash script (alias)');
  console.log('   GET /cafe.ps1 - PowerShell script (Windows)');
  console.log('   GET /windows  - PowerShell script (alias)');
  console.log('   GET /health   - Health check');
});
