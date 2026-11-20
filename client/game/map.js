const map = L.map("map", {
    zoomSnap: 0.1,
    minZoom: 1,
    worldCopyJump: true,
    bounceAtZoomLimits: false,
    maxBoundsViscosity: 1.0 // Trava perfeitamente na borda vertical sem travar o zoom
});

const mapStyle = {
    fillColor: "#ffffff",
    fillOpacity: 1,
    color: "#000000",
    weight: 1
};

let selectedLayer = null;

const minLat = -75;
const maxLat = 80;

const territoryLayers = new Map();

fetch("../map.json")
    .then(resposta => resposta.json())
    .then(dados => {
        // 1. Renderiza as 3 cópias para permitir o loop horizontal
        [-360, 0, 360].forEach(offset => {
            L.geoJSON(dados, {
                style: mapStyle,

                coordsToLatLng: function (coords) {
                    return new L.LatLng(
                        coords[1],
                        coords[0] + offset
                    );
                },



                onEachFeature: (feature, layer) => {
                    const name = feature.properties.shapeName;

                    // Guarda todas as cópias do território
                    if (!territoryLayers.has(name)) {
                        territoryLayers.set(name, []);
                    }

                    territoryLayers.get(name).push(layer);



                    layer.on('click', () => {
                        const territoryName = feature.properties.shapeName;

                        // Remove o destaque anterior
                        if (selectedLayer) {
                            selectedLayer.setStyle({
                                color: "#000000",
                                weight: 1
                            });
                        }

                        // Seleciona o novo território
                        selectedLayer = layer;

                        layer.setStyle({
                            color: "#000000",
                            weight: 4
                        });

                        document.dispatchEvent(
                            new CustomEvent('territoryClick', {
                                detail: {
                                    name: territoryName
                                }
                            })
                        );
                    });
                },
            }).addTo(map);
        });

        document.dispatchEvent(
            new CustomEvent('mapReady')
        )

        // 2. Define os limites: Trava a latitude (-75 a 80), mas deixa a longitude livre (-Infinity a Infinity)
        const limitesPrecedidos = [
            [minLat, -Infinity],
            [maxLat, Infinity]
        ];

        map.setMaxBounds(limitesPrecedidos);

        // 3. Ajusta a visão inicial
        map.fitBounds([
            [minLat, -180],
            [maxLat, 180]
        ]);

        setTimeout(() => { map.invalidateSize(); }, 200);

        // 4. Trava o zoom mínimo dinamicamente para não mostrar espaço vazio nos polos
        map.setMinZoom(map.getZoom());
    });

document.addEventListener('updateTerritoryColor', event => {
    const { name, color } = event.detail;

    const layers = territoryLayers.get(name);

    if (!layers) {
        console.warn(`Territoy not found: ${name}`);
        return;
    }

    layers.forEach(layer => {
        layer.setStyle({
            fillColor: color
        });
    });
});