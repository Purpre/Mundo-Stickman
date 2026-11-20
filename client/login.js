document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const country = document.getElementById("country").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const response = await fetch("/api/country/" + country + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
        document.getElementById("errorMessage").textContent =
            data.error || "Não foi possível entrar.";
        return;
    }

    sessionStorage.setItem("userCountry", country);
    sessionStorage.setItem("userPassword", password);

    window.location.href = "/game";
});