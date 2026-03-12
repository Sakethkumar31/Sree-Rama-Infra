const fs = require('fs');
const path = require('path');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

function ensureDir() {
    fs.mkdirSync(dataDir, { recursive: true });
}

function filePath(name) {
    return path.join(dataDir, `${name}.json`);
}

function ensureFile(name, defaultValue) {
    ensureDir();
    const target = filePath(name);

    if (!fs.existsSync(target)) {
        fs.writeFileSync(target, JSON.stringify(defaultValue, null, 2));
    }
}

function readCollection(name, defaultValue) {
    ensureFile(name, defaultValue);
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
}

function writeCollection(name, value) {
    ensureDir();
    fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2));
}

function initializeStore(seedData) {
    const collections = seedData || {};

    Object.keys(collections).forEach((name) => {
        ensureFile(name, collections[name] || []);
    });
}

module.exports = {
    dataDir,
    initializeStore,
    readCollection,
    writeCollection
};
