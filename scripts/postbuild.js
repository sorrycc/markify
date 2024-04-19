const path = require('path');
const fs = require('fs');
const assert = require('assert');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const scripts = fs.readdirSync(distDir).filter(file => file.endsWith('.js'));
scripts.forEach(transformScript);

function transformScript(script) {
    const scriptPath = path.join(distDir, script);
    let content = fs.readFileSync(scriptPath, 'utf8');
    
    content = content.split('\n').map(line => {
        // replace /// file
        if (line.startsWith('\'file: ')) {
            const file = line.replace('\'file: ', '').replace('\';', '');
            const filePath = path.join(root, file);
            assert(fs.existsSync(filePath), `File not found: ${file}`);
            return fs.readFileSync(filePath, 'utf8');
        }
        // remove __esModule define
        if (line === 'Object.defineProperty(exports, "__esModule", { value: true });') return '';
        return line;
    }).join('\n');
    // add anonymous function wrapper
    content = `(() => {${content}})();`;

    fs.writeFileSync(scriptPath, content, 'utf8');
    console.log(`Transformed ${script}`);
}
