
// CONSTANTES

const military = document.getElementById("military");
const economy = document.getElementById("economy");
const resources = document.getElementById("resources");
const technology = document.getElementById("technology");
const education = document.getElementById("education");
const stability = document.getElementById("stability");
const commerce = document.getElementById("commerce");

const attributes = [ // Não sei porque nem onde esse lista é usada, mas funciona
    "military",
    "economy",
    "resources",
    "technology",
    "education"
];

const points = document.getElementById("diaryPoints");
const objectives = document.getElementById("diaryObjectives");
const dominations = document.getElementById("diaryDominations");

const userCountry = sessionStorage.getItem("userCountry");
const userPassword = sessionStorage.getItem("userPassword");

if (!userCountry || !userPassword) {
    window.location.href = "/";
}

// BOTÕES

const atbReduceButtons = [...document.querySelectorAll('.AtbButton')]
    .filter(elemento => elemento.textContent.trim() === '-');

const atbIncreaseButtons = [...document.querySelectorAll('.AtbButton')]
    .filter(elemento => elemento.textContent.trim() === '+');

const atbButtons = document.querySelectorAll(".AtbButton");
const objButtons = document.querySelectorAll(".objButton");

const conversionButtons = document.querySelectorAll(".convertButton");
const eduEarningButtons = document.querySelectorAll(".eduEarning");

const buildFortressButton = document.getElementById("buildFortressButton");
const buildCityButton = document.getElementById("buildCityButton");

const conquerTerritoryButton = document.getElementById("conquerTerritoryButton");

const makeCapitalButton = document.getElementById("makeCapitalButton");


// VARIAVEIS

let playerEconomy = 0; // Usado pra bloquear algumas ações que requerem economia de aparecerem
let playerResources = 0; // Mesmo que o colega de cima

let selectedTerritory = null;

let attackingTerritories = null;


// FUNÇÕES

function updateTerritoryPanelUi(territoryName) {
    fetch("/api/country/getTerritory", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            territoryName: territoryName,
            country: userCountry,
            password: userPassword
        })
    })
        .then(response => response.json())
        .then(territory => {
            const cityLabel = document.getElementById("territoryCityLabel");
            const ownerLabel = document.getElementById("territoryOwner");
            const flag = document.getElementById("territoryFlag");

            if (!territory.city || !territory.city.name) {
                document.getElementById("makeCapitalButton").style.display = "none";
                cityLabel.textContent = "Cidade: Nenhuma";
                document.getElementById("territoryCityTypeLabel").style.display = "none";
                if (territory.country.toLowerCase() === userCountry) {
                    document.getElementById("buildCityDiv").style.display = "flex";
                }
                else {
                    document.getElementById("buildCityDiv").style.display = "none";
                }
            } else {
                cityLabel.textContent = "Cidade: " + territory.city.name + (territory.city.capital ? " (capital)" : "");
                document.getElementById("buildCityDiv").style.display = "none";
                document.getElementById("territoryCityTypeLabel").style.display = "inline";
                let type = territory.city.type;
                if (type == "economy")
                    type = "economica";
                else if (type == "military")
                    type = "militar";
                else if (type == "resources")
                    type = "rural";
                else if (type == "technology")
                    type = "tecnologica";
                else if (type == "education")
                    type = "universitaria";
                else if (type == "stability")
                    type = "estabilizadora";

                document.getElementById("territoryCityTypeLabel").textContent = "Cidade " + type;

                if (territory.country.toLowerCase() === userCountry) {
                    if (!territory.city.capital) {
                        document.getElementById("makeCapitalButton").style.display = "inline";
                    }
                    else {
                        document.getElementById("makeCapitalButton").style.display = "none";
                    }
                }
                else {
                    document.getElementById("makeCapitalButton").style.display = "none";
                }
            }

            if (territory.country.toLowerCase() === userCountry) {
                document.getElementById("conquerTerritoryButton").style.display = "none";
            }
            else {
                document.getElementById("conquerTerritoryButton").style.display = "inline";
            }


            if (!territory.fortress) {
                document.getElementById("territoryFortressLabel").style.display = "none";
                if (territory.country.toLowerCase() === userCountry) {
                    document.getElementById("buildFortressButton").style.display = "inline";
                }
                else {
                    document.getElementById("buildFortressButton").style.display = "none";
                }
            }
            else {
                document.getElementById("buildFortressButton").style.display = "none";
                document.getElementById("territoryFortressLabel").style.display = "flex";
            }

            // Verifica se existe proprietário
            if (!territory.country) {
                ownerLabel.textContent = "Proprietário: Nenhum";
                cityLabel.textContent = "Cidade: Nenhuma";
                document.getElementById("buildCityDiv").style.display = "none";

                // Remove a bandeira anterior
                flag.src = "/flags/anarquista.png";
                flag.alt = "Sem proprietário";

            }
            else {
                // Busca a bandeira do proprietário
                fetch("/api/country/" + territory.country.toLowerCase())
                    .then(response => response.json())
                    .then(country => {
                        console.log(country.flag);
                        flag.src = country.flag;
                        flag.alt = "Bandeira de " + territory.country;
                        ownerLabel.textContent = "Proprietário: " + country.name;
                    });
            }

            if (playerEconomy < 10 || playerResources < 2) {
                document.getElementById("buildCityDiv").style.display = "none";
            }
            if (playerEconomy < 2) {
                document.getElementById("buildFortressButton").style.display = "none";
            }

            if (attackingTerritories.includes(selectedTerritory)) {
                document.getElementById("conquerTerritoryButton").style.display = "none";
                document.getElementById("attackingLabel").style.display = "inline";
            }
            else {
                document.getElementById("attackingLabel").style.display = "none";
            }
        });
}

function updateUi() {
    fetch("/api/country/" + userCountry + "/" + userPassword)
        .then(response => response.json())
        .then(country => {

            // Atualizar Painel de atributos

            // Atributos
            military.textContent = "Poder Militar: " + country.attributes.military;
            economy.textContent = "Economia: " + country.attributes.economy;
            resources.textContent = "Recursos: " + country.attributes.resources;
            technology.textContent = "Tecnologia: " + country.attributes.technology;
            education.textContent = "Educação: " + country.attributes.education;
            stability.textContent = "Estabilidade: " + country.attributes.stability;
            commerce.textContent = "Comércio: " + country.attributes.commerce;

            playerEconomy = country.attributes.economy;
            playerResources = country.attributes.resources;

            // Caso o jogador não tenha alterado seus pontos diarios, não é possivel reduzi-los
            attributes.forEach(attribute => {
                atbReduceButtons.forEach(button => {
                    if (button.classList.contains(attribute)) {
                        button.style.display =
                            country.attributes_change_history[attribute] === 0
                                ? "none"
                                : "";
                    }
                });
            });


            // Atualiza a quantidade de pontos/objetivos/dominações o jogador tem
            points.textContent = "Pontos diarios disponiveis: " + country.points;
            objectives.textContent = "Objetivos diarios disponiveis: " + country.objectives;
            dominations.textContent = "Dominações diarias disponiveis: " + country.daily_dominations;


            // Não sei se o lugar dessas funções é aqui
            if (selectedTerritory != null)
                updateTerritoryPanelUi(selectedTerritory);
            attackingTerritories = country.attacking_territories;


            atbIncreaseButtons.forEach(button => { // Some com os botões de aumentar atributo caso nenhum esteja disponivel
                if (country.points === 0)
                    button.style.display = "none";
                else
                    button.style.display = "";
            });

            objButtons.forEach(button => { // Some com os botões de objetivo caso nenhum esteja disponivel
                if (country.objectives === 0)
                    button.style.display = "none";
                else
                    button.style.display = "";
            });

            conversionButtons.forEach(button => { // Some com os botões de conversão caso nenhum esteja disponivel
                if (country.attributes[button.classList[2]] < parseInt(button.classList[1])) {
                    button.style.display = "none";
                }
                else {
                    button.style.display = "";
                }
            });

            eduEarningButtons.forEach(button => { // Some com os botões de ganho da educação se nenhum estiver disponivel
                if (country.education_earnings === 0) {
                    button.style.display = "none";
                }
                else {
                    button.style.display = "";
                }
            });

            document.getElementById("capitalLabel").textContent = "Capital: " + country.capital;
        });
}

async function updateMap() {
    await fetch("/api/country/getTerritoriesColors")
        .then(response => response.json())
        .then(territories => {
            territories.forEach(territory => {

                territory.territories.forEach(layer => {
                    document.dispatchEvent(
                        new CustomEvent('updateTerritoryColor', {
                            detail: {
                                name: layer,
                                color: territory.color
                            }
                        })
                    );
                });
            });

        });
}


// SETUP INICIAL

updateUi();

document.addEventListener('mapReady', () => {
    updateMap();
});

fetch("/api/country/" + userCountry) // Atualiza nome e bandeira do jogador
    .then(response => response.json())
    .then(country => {

        document.getElementById("name").textContent = country.name;

        document.getElementById("flag").src = country.flag;

    });

fetch("/api/world") // Atualiza o ano atual
    .then(response => response.json())
    .then(world => {

        document.getElementById("year").textContent = "Ano: " + world.year;
    });



// Implementações do painel de atributos

atbButtons.forEach(button => {
    button.addEventListener("click", () => {

        let op = button.innerHTML;

        fetch("/api/country/" + userCountry + "/changeAttribute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                attribute: button.classList[0],
                operation: op,
                password: userPassword
            })
        });

        updateUi();
    });
});

objButtons.forEach(button => {
    button.addEventListener("click", async () => {
        const response = await fetch(
            "/api/country/" + userCountry + "/rollObjective",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    attribute: button.classList[0],
                    password: userPassword
                })
            }
        );

        const data = (await response.json());
        let text = "";
        if (data.success)
            text = "Sucesso!";
        else
            text = "Falhou!";

        alert("O numero rolado foi " + data.number + "\n" + text);
        updateUi();
    });
});

eduEarningButtons.forEach(button => {
    button.addEventListener("click", async () => {
        fetch("/api/country/" + userCountry + "/eduEarning", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                convertTo: button.classList[1],
                password: userPassword
            })
        });
        updateUi();
    });
});

document.querySelectorAll(".convertButton").forEach(button => {
    button.addEventListener("click", () => {
        const conversionJson = {
            "from": {
                "attribute": button.classList[2],
                "amount": parseInt(button.classList[1])
            },
            "to": button.classList[3]
        }


        fetch("/api/country/" + userCountry + "/convert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                conversion: conversionJson,
                password: userPassword
            })
        });
        updateUi();
    })
});


// Implementações do painel de territorios

document.addEventListener('territoryClick', event => {
    const territoryName = event.detail.name;
    selectedTerritory = territoryName;

    document.getElementById("selectedTerritoryLabel").textContent = "Territorio selecionado: " + territoryName;

    updateTerritoryPanelUi(territoryName);

});

buildFortressButton.addEventListener("click", async () => {
    const response = await fetch("/api/country/" + userCountry + "/buildFortress", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            territory: selectedTerritory,
            password: userPassword
        })
    });

    updateUi();

});

buildCityButton.addEventListener("click", async () => {
    const name = document.getElementById("cityName").value
    const type = document.getElementById("cityTypeSelect").value

    const response = await fetch("/api/country/" + userCountry + "/buildCity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            territory: selectedTerritory,
            type: type,
            name: name,
            password: userPassword
        })
    });

    updateUi();

});

conquerTerritoryButton.addEventListener("click", async () => {
    const response = await fetch("/api/country/" + userCountry + "/registerAttack", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            territory: selectedTerritory,
            password: userPassword
        })
    });

    setTimeout(function () {
        updateUi();
        updateMap();
    }, 500);
});

makeCapitalButton.addEventListener("click", async () => {
    const response = await fetch("/api/country/" + userCountry + "/makeCapital", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            territory: selectedTerritory,
            password: userPassword
        })
    });

    updateUi();
});