const https = require('https');
const coords = [
    [11.388987, -69.675065],
    [11.391000, -69.674000],
    [11.390000, -69.672000],
    [11.388000, -69.673000],
    [11.389500, -69.674500],
    [11.395000, -69.672000],
    [11.400541, -69.671707],
    [11.402000, -69.671500],
    [11.402000, -69.668000],
    [11.407000, -69.668000],
    [11.409200, -69.671800],
    [11.411100, -69.653400],
    [11.412500, -69.635000],
    [11.414500, -69.625000]
];
const osrmStr = coords.map(c => `${c[1]},${c[0]}`).join(';');
const url = `https://router.project-osrm.org/route/v1/driving/${osrmStr}?geometries=geojson`;

https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const j = JSON.parse(data);
        if (j.routes && j.routes[0]) {
            const c = j.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            require('fs').writeFileSync('route_output.json', JSON.stringify(c));
            console.log('Wrote', c.length, 'points');
        } else {
            console.log('Error', data);
        }
    });
}).on('error', console.error);
