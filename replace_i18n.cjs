const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src/i18n/locales');

// Regex patterns for each language
const replacements = {
    en: [
        { regex: /\bActivities\b/g, replacement: 'Events' },
        { regex: /\bactivities\b/g, replacement: 'events' },
        { regex: /\bActivity\b/g, replacement: 'Event' },
        { regex: /\bactivity\b/g, replacement: 'event' }
    ],
    fr: [
        { regex: /\bActivités\b/g, replacement: 'Événements' },
        { regex: /\bactivités\b/g, replacement: 'événements' },
        { regex: /\bActivité\b/g, replacement: 'Événement' },
        { regex: /\bactivité\b/g, replacement: 'événement' }
    ],
    ar: [
        { regex: /الأنشطة/g, replacement: 'الفعاليات' },
        { regex: /أنشطة/g, replacement: 'فعاليات' },
        { regex: /النشاط/g, replacement: 'الفعالية' },
        { regex: /نشاط/g, replacement: 'فعالية' }
    ]
};

function processObject(obj, langConfig) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            let val = obj[key];
            for (const rule of langConfig) {
                val = val.replace(rule.regex, rule.replacement);
            }
            obj[key] = val;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            processObject(obj[key], langConfig);
        }
    }
}

function processDirectory(dirPath, lang) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath, lang);
        } else if (fullPath.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            processObject(data, replacements[lang]);
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Updated ${fullPath}`);
        }
    }
}

['en', 'fr', 'ar'].forEach(lang => {
    const langDir = path.join(localesPath, lang);
    if (fs.existsSync(langDir)) {
        processDirectory(langDir, lang);
    }
});
