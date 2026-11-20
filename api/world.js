const express = require("express");
const fs = require("fs");
const router = express.Router();

const worldData = require("../world_data.json");

function updateWorldData() {
    fs.writeFileSync(
        "./world_data.json",
        JSON.stringify(worldData, null, 4)
    );
}

function calculateAttacks() {
    Object.values(worldData.attack_registries).forEach(attack_register => {

        let territoryOwner = null;

        for (const [countryName, otherCountry] of Object.entries(
            worldData.countries
        )) {
            if (Object.hasOwn(otherCountry.territories, attack_register.territory)) {
                territoryOwner = countryName;
            }
        }

        worldData.countries[attack_register.attacker].attributes.stability -= 1;

        if (territoryOwner != null) {
            const totalInfantry = Object.values(
                worldData.countries[territoryOwner]
                    .territories[attack_register.territory]
                    .infantry
            ).reduce((total, infantry) => total + infantry, 0);

            if (attack_register.attacking_troops > worldData.countries[territoryOwner].attributes.military) {
                delete worldData.countries[territoryOwner]
                    .territories[attack_register.territory];

                worldData.countries[attack_register.attacker].territories[attack_register.territory] = {
                    infantry: {
                        [attack_register.attacker]: 0
                    },
                    city: {
                        name: "",
                        type: "",
                        capital: false
                    },
                    fortress: false,
                    scorched: false

                }
                worldData.countries[territoryOwner].attributes.stability -= 1;
            }
            else {
                worldData.countries[attack_register.attacker].attributes.stability -= 1;
            }
        }
        else {
            worldData.countries[attack_register.attacker].territories[attack_register.territory] = {
                infantry: {
                    [attack_register.attacker]: 0
                },
                city: {
                    name: "",
                    type: "",
                    capital: false
                },
                fortress: false,
                scorched: false

            }
            worldData.countries[attack_register.attacker].attributes.resources += 2;
        }

    });

    Object.values(worldData.countries).forEach(country => {
        country.attacking_territories = [];
    });

    worldData.attack_registries = [];
    updateWorldData();
}

function updateYear() {
    const year = worldData.world.year;

    if (!worldData.world.ongoing_war) {
        let increment;

        if (year < 1800)
            increment = 100;
        else if (year < 1900)
            increment = 20;
        else if (year < 2000)
            increment = 10;
        else if (year < 2020)
            increment = 5;
        else
            increment = 1;

        worldData.world.year =
            (Math.floor(year / increment) + 1) * increment;
    }
    else {
        if (year < 1800)
            worldData.world.year += 5;
        else
            worldData.world.year += 1;
    }

    updateWorldData();
}

router.get("/", (req, res) => {
    const world = worldData.world;
    res.json(world);
});

router.get("/getAvailableColors", (req, res) => {
    res.json(worldData.available_colors);
});

module.exports = {
    router,
    updateYear,
    updateWorldData,
    worldData,
    calculateAttacks
};