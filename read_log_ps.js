const { execSync } = require('child_process');
try {
    const output = execSync('Get-Content server.log -Tail 100', { shell: 'powershell.exe', encoding: 'utf8' });
    console.log(output.replace(/[^\x20-\x7E\n\r\t]/g, ''));
} catch (err) {
    console.error(err.stdout || err.message);
}
