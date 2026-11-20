fetch("/api/world/getAvailableColors")
    .then(response => response.json())
    .then(colors => {
        const select = document.getElementById("selectColor");

        select.querySelectorAll("option").forEach(option => {
            option.disabled = (colors[option.id] ? false : true);
        });
    });

document.getElementById("createCountryForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch("/api/country/createCountry", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: document.getElementById("countryName").value,
            ID: document.getElementById("countryID").value.trim().toLowerCase(),
            password: document.getElementById("password").value,
            color: document.getElementById("selectColor").value,
            territory: document.getElementById("initialTerritory").value
        })
    });

    const data = await response.json();

    if (response.ok) {
        window.location.href = "/";
    }

    if (!response.ok) {
        document.getElementById("errorMessage").textContent =
            data.error || "Não foi possível entrar.";
        return;
    }
});