const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "client")));

app.use("/flags", express.static(path.join(__dirname, "flags")));

const worldModule = require("./api/world");
const countryModule = require("./api/country");

app.use("/api/country", countryModule.router);
app.use("/api/world", worldModule.router);

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

function updateTurn() {
    worldModule.updateYear();
    countryModule.updateCountriesData();
    worldModule.calculateAttacks();
}

const readline = require("node:readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on("line", (input) => {
    if (input === "updateCountriesData") {
        countryModule.updateCountriesData();
    }
    else if (input === "updateTurn") {
        updateTurn();
    }
});