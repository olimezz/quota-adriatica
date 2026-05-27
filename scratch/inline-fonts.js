const fs = require('fs');

const fontCSS = fs.readFileSync('scratch/extracted.css', 'utf8').trim();

function optimizeFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Remove the synchronous Google Fonts link
    const fontLinkRegex = /<!-- Google Fonts caricati in sincrono con display=swap per velocizzare l'LCP ed evitare sbalzi di layout \(FOUT\) -->\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">\s*/;
    html = html.replace(fontLinkRegex, '');
    
    // Insert the font CSS inside the <style> tag
    const styleTag = '<style>';
    if (html.includes(styleTag)) {
        html = html.replace(styleTag, `${styleTag}\n${fontCSS}\n`);
        console.log(`Successfully inlined fonts into ${filePath}`);
    } else {
        console.log(`Error: Could not find <style> tag in ${filePath}`);
    }
    
    fs.writeFileSync(filePath, html, 'utf8');
}

optimizeFile('index.html');
