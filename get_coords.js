const https = require('https');

const queries = [
    'Avenida Sucre, Coro',
    'Avenida El Tenis, Coro',
    'Avenida Santa Rosa, Coro',
    'Avenida Ruiz Pineda, Coro',
    'Avenida Manaure, Coro',
    'Avenida Romulo Gallegos, Coro',
    'Avenida Independencia, Coro',
    'Tres Platos, Coro'
];

function query(q) {
    return new Promise(resolve => {
        const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1';
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.length > 0) {
                        resolve(`${q}: [${parsed[0].lat}, ${parsed[0].lon}]`);
                    } else {
                        resolve(`${q}: Not found`);
                    }
                } catch (e) {
                    resolve(`${q}: Error`);
                }
            });
        }).on('error', () => resolve(`${q}: Req Error`));
    });
}

async function main() {
    for (const q of queries) {
        console.log(await query(q));
    }
}
main();
