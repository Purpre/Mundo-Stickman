const express = require("express");
const router = express.Router();

const colors = {
    "red": "#ff4444",
    "orange": "#eba800",
    "yellow": "#ebe300",
    "black": "#404040",
    "dark_green": "#20a40c",
    "light_green": "#7dff55",
    "purple": "#730096",
    "pink": "#ff00ae",
    "cyan": "#44aaff",
    "blue": "#4447ff",
    "brown": "#613c02",
    "white": "#ffeaa6",
    "wine": "#870029",
    "light_brown": "#a37349",
    "chaotic_green": "#406643",
    "light_pink": "#ffbfeb",
    "gray": "#8f8f8f"
}

const worldModule = require("./world");

const conversions = require("../conversions.json");

function updateCountriesData() {
    Object.values(worldModule.worldData.countries).forEach(country => {

        country.points = 2; // Talvez altere para 1
        country.objectives = 2;
        country.daily_dominations = 2;

        country.education_earnings = Math.floor(country.attributes.education / 5); // + estabilidade ou tecnologia a cada 5 de educação
        country.attributes_change_history = {
            "military": 0,
            "economy": 0,
            "resources": 0,
            "technology": 0,
            "education": 0
        };

        country.attributes.stability += 1;

        Object.values(country.territories).forEach(territory => {
            if (territory.city.name != "" && territory.city.type != "") {
                country.attributes[territory.city.type] += (territory.city.capital ? 2 : 1) // Adiciona os atributos correspondentes de cada cidade
            }
        });

        country.attributes.economy += Math.floor(country.attributes.commerce / 5); // + economia a cada 5 de comercio
    });
    worldModule.updateWorldData();
}

router.post("/createCountry", (req, res) => {
    console.log(req.body)

    Object.values(worldModule.worldData.countries).forEach(country => {
        if (country.id === req.body.ID) {
            return res.status(403).json({
                error: "ID de país já existe"
            })
        }

        Object.values(country.territories).forEach(territory => {
            if (territory.name === req.body.territory) { // Por algum motivo não funciona, acho que .name não é uma propriedade valida do territory
                return res.status(403).json({
                    error: "Algum país já possui esse territorio inicial"
                })
            }
        })
    });

    if (!worldModule.worldData.available_colors[req.body.color]) {
        return res.status(403).json({
            error: "Cor já foi escolhida"
        })
    }

    worldModule.worldData.countries[req.body.ID] = {
        "id": req.body.ID,
        "name": req.body.name,
        "password": req.body.password,
        "color": colors[req.body.color],
        "flag": "../flags/none.png",
        "attributes": {
            "military": 0,
            "economy": 0,
            "resources": 0,
            "technology": 0,
            "education": 0,
            "stability": 10,
            "commerce": 0
        },
        "attributes_change_history": {
            "military": 0,
            "economy": 0,
            "resources": 0,
            "technology": 0,
            "education": 0
        },
        "points": 3,
        "objectives": 2,
        "daily_dominations": 2,
        "education_earnings": 0,
        "territories": {
            [req.body.territory]: {
                "infantry": {
                    [req.body.ID]: 0
                },
                "city": {
                    "name": "",
                    "type": "",
                    "capital": false
                },
                "fortress": false,
                "scorched": false
            }
        },
        "capital": "",
        "available_cities": {
            "military": 2,
            "economy": 2,
            "resources": 2,
            "technology": 2,
            "education": 2,
            "stability": 2
        },
        "at_war_with": [],
        "attacking_territories": []
    }

    worldModule.worldData.available_colors[req.body.color] = false;

    worldModule.updateWorldData();

    return res.json({
        success: true
    })
});

router.get("/getTerritoriesColors", (req, res) => {
    const colors = {};

    const countries = worldModule.worldData.countries;

    for (const country of Object.values(countries)) {
        const color = country.color;

        if (!colors[color]) {
            colors[color] = [];
        }

        colors[color].push(
            ...Object.keys(country.territories)
        );
    }

    const result = Object.entries(colors).map(([color, territories]) => ({
        color,
        territories
    }));

    res.json(result);
});

router.post("/getTerritory", (req, res) => {
    const territoryName = req.body.territoryName;
    const countryName = req.body.country;
    const password = req.body.password;

    const countries = worldModule.worldData.countries;
    const country = countries[countryName];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    for (const [ownerCountryName, ownerCountry] of Object.entries(countries)) {
        if (Object.hasOwn(ownerCountry.territories, territoryName)) {
            const territory = ownerCountry.territories[territoryName];

            // O país autenticado é o dono do território.
            if (countryName === ownerCountryName) {
                return res.json({
                    name: territoryName,
                    country: ownerCountry.name,
                    ...territory
                });
            }

            // O país autenticado não é o dono.
            return res.json({
                country: ownerCountry.id,
                city: territory.city,
                fortress: territory.fortress
            });
        }
    }

    return res.json({
        country: "",
        city: {
            "name": "",
            "type": "",
            "capital": false
        },
        fortress: false
    });
});

router.get("/:name", (req, res) => {

    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    res.json({
        name: country.name,
        color: country.color,
        flag: country.flag
    });
});

router.get("/:name/:password", (req, res) => {

    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.params.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    res.json(country);
});

router.post("/:name/changeAttribute", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    const attribute = req.body.attribute;
    const operation = req.body.operation;

    if (country.points > 0) {

        if (operation === "+") {
            if (country.attributes[attribute] < 20) {
                country.points--;
                country.attributes[attribute]++;
                country.attributes_change_history[attribute]++;
            }
        }
    }
    if (operation === "-") {
        if (country.attributes[attribute] > 0) {
            country.attributes[attribute]--;
            if (country.attributes_change_history[attribute] > 0) {
                country.points++;
            }
            country.attributes_change_history[attribute]--;
        }
    }

    worldModule.updateWorldData();

    res.json({
        success: true
    });
});

router.post("/:name/rollObjective", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    const attribute = req.body.attribute;
    const num = Math.floor(Math.random() * 6) + 1;
    const success = num > 3;

    if (country.objectives > 0) {
        country.objectives--;

        if (success) {
            if (country.attributes[attribute] < 20) {
                country.attributes[attribute]++;
            }
        }
    }
    worldModule.updateWorldData();

    return res.json({
        number: num,
        success: success
    });
});

router.post("/:name/convert", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    const conversion = req.body.conversion;

    if (conversions.some(item => JSON.stringify(item) === JSON.stringify(conversion))) {
        if (country.attributes[conversion.from.attribute] >= conversion.from.amount) {
            country.attributes[conversion.from.attribute] -= conversion.from.amount;
            country.attributes[conversion.to] += 1;
        }
    }
    worldModule.updateWorldData();

    return res.json({
        success: true
    });
});

router.post("/:name/eduEarning", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    const convertTo = req.body.convertTo;

    if (country.education_earnings > 0) {
        country.education_earnings--;
        country.attributes[convertTo]++;
    }
    worldModule.updateWorldData();

    return res.json({
        success: true
    });
});

router.post("/:name/buildFortress", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];
    const territoryName = req.body.territory;

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    if (!Object.hasOwn(country.territories, territoryName)) {
        return res.status(403).json({
            error: "Territory does not belong to this country"
        });
    }

    const territory = country.territories[territoryName];

    if (!territory.fortress && country.attributes.economy >= 2) {
        country.attributes.economy -= 2;
        territory.fortress = true;
    }

    worldModule.updateWorldData();

    return res.json({
        success: true
    });
});

router.post("/:name/buildCity", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];
    const territoryName = req.body.territory;

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    if (!Object.hasOwn(country.territories, territoryName)) {
        return res.status(403).json({
            error: "Territory does not belong to this country"
        });
    }

    const territory = country.territories[territoryName];
    const name = req.body.name;
    const type = req.body.type;

    if (country.available_cities[type] > 0) {
        if (country.attributes.economy >= 10 && country.attributes.resources >= 2) {
            if (territory.city.type == "" && territory.city.name == "") {
                country.available_cities[type] -= 1;
                country.attributes.economy -= 10;
                country.attributes.resources -= 2;
                territory.city.type = type;
                territory.city.name = name;
            }
        }
    }

    worldModule.updateWorldData();

    return res.json({
        success: true
    });
});

router.post("/:name/registerAttack", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];
    const territoryName = req.body.territory;
    const attacking_troops = country.attributes.military;

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    if (Object.hasOwn(country.territories, territoryName)) {
        return res.status(403).json({
            error: "Territory makes part of your country!"
        });
    }

    if (country.daily_dominations === 0) {
        return res.status(403).json({
            error: "You cant conquer anymore, Mr. Napoleon"
        });
    }

    if (country.attacking_territories.includes(territoryName)) {
        return res.status(403).json({
            error: "Cannot attack this territory again"
        });
    }

    country.daily_dominations -= 1;

    let territoryOwner = null;

    for (const [countryName, otherCountry] of Object.entries(
        worldModule.worldData.countries
    )) {
        if (Object.hasOwn(otherCountry.territories, territoryName)) {
            territoryOwner = countryName;
        }
    }

    worldModule.worldData.attack_registries.push({
        attacker: country.id,
        attacking_troops: attacking_troops,
        defender: territoryOwner,
        territory: territoryName
    });

    country.attacking_territories.push(territoryName);

    worldModule.updateWorldData();

    return res.json({
        success: true
    });

});

router.post("/:name/makeCapital", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];
    const territoryName = req.body.territory;

    if (!country) {
        return res.status(404).json({
            error: "Country not found"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(403).json({
            error: "Incorrect password"
        });
    }

    if (!Object.hasOwn(country.territories, territoryName)) {
        return res.status(403).json({
            error: "Territory does not belong to this country"
        });
    }

    if (country.territories[territoryName].city.name === "" && country.territories[territoryName].city.type === "") {
        return res.status(403).json({
            error: "Territory must have a city"
        });
    }

    if (country.attributes.stability < 5) {
        return res.status(403).json({
            error: "Stability must be greater than 5"
        });
    }

    country.attributes.stability -= 5;


    Object.values(country.territories).forEach(territory => {
        territory.city.capital = false;
    });

    country.territories[territoryName].city.capital = true;
    country.capital = country.territories[territoryName].city.name;

    worldModule.updateWorldData();

    return res.json({
        success: true
    });
});

router.post("/:name/login", (req, res) => {
    const country = worldModule.worldData.countries[req.params.name];

    if (!country) {
        return res.status(404).json({
            error: "País não encontrado"
        });
    }

    if (req.body.password !== country.password) {
        return res.status(401).json({
            error: "Senha incorreta"
        });
    }

    return res.json({ success: true });
});

module.exports = {
    router,
    updateCountriesData
};