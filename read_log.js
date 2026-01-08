const fs = require('fs');
try {
    const data = fs.readFileSync('server.log', 'utf8');
    const lines = data.split('\n');
    const lastLines = lines.slice(-100).join('\n');
    // Remove non-printable characters
    const cleanData = lastLines.replace(/[^\x20-\x7E\n\r\t]/g, '');
    console.log(cleanData);
} catch (err) {
    console.error(err);
}
