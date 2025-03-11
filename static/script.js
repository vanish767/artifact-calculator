document.addEventListener("DOMContentLoaded", function () {
    let selectedArtifacts = [];
    let selectedArtifactData = null;

    const artifactSelect = document.getElementById("artifact-select");
    const confirmButton = document.getElementById("confirm-artifact");
    const statsDiv = document.getElementById("artifact-stats");
    const artifactNameHeader = document.getElementById("artifact-name");
    const tierSelectionDiv = document.getElementById("tier-selection");
    const resultDiv = document.getElementById("calculation-result");
    const selectedArtifactsList = document.getElementById("selected-artifacts");

    let allArtifacts = [];

    // Загрузка артефактов
    fetch("/get_artifacts")
        .then(response => response.json())
        .then(data => {
            allArtifacts = data;

            artifactSelect.addEventListener("change", function () {
                confirmButton.disabled = artifactSelect.value === "";
            });

            confirmButton.addEventListener("click", function () {
                let artifactName = artifactSelect.value;
                if (artifactName) addArtifact(artifactName);
                confirmButton.disabled = true;
                artifactSelect.value = "";
            });
        })
        .catch(error => console.error("❌ Ошибка загрузки артефактов:", error));

    // Добавление артефакта в список (разрешает дубликаты)
    function addArtifact(name) {
        const artifactId = Date.now() + Math.random(); // Генерируем уникальный ID
        selectedArtifacts.push({ id: artifactId, "Имя": name, "Тир": null });
        updateSelectedList();
    }

    // Обновление списка выбранных артефактов
    function updateSelectedList() {
        selectedArtifactsList.innerHTML = "";
        selectedArtifacts.forEach((artifact, index) => {
            let listItem = document.createElement("li");
            listItem.classList.add("artifact-item");

            let artifactText = document.createElement("span");
            artifactText.textContent = `${artifact["Имя"]} (${artifact["Тир"] ? "Тир " + artifact["Тир"] : "Выберите тир"})`;
            artifactText.classList.add("clickable");

            // Одиночный клик — показать выбор тира
            artifactText.onclick = function () {
                showTierSelection(artifact);
            };

            // Крестик для удаления артефакта
            let removeButton = document.createElement("span");
            removeButton.textContent = " ✖️";
            removeButton.classList.add("remove-btn");
            removeButton.onclick = function () {
                selectedArtifacts = selectedArtifacts.filter(a => a.id !== artifact.id);
                updateSelectedList();
                artifactNameHeader.innerHTML = "Выберите артефакт из списка";
                tierSelectionDiv.innerHTML = "Здесь появится выбор тира...";
                statsDiv.innerHTML = "Характеристики появятся после выбора тира...";
                calculateStats();
            };

            listItem.appendChild(artifactText);
            listItem.appendChild(removeButton);
            selectedArtifactsList.appendChild(listItem);
        });

        calculateStats(); // Автоматический пересчёт характеристик
    }

    // Отображение тиров и характеристик
    function showTierSelection(artifact) {
        let artifactData = allArtifacts.find(a => a["Имя"] === artifact["Имя"]);
        if (!artifactData) return;

        artifactNameHeader.innerHTML = artifact["Имя"];
        tierSelectionDiv.innerHTML = `<h4>Выберите тир:</h4>`;

        artifactData["Варианты"].forEach(variant => {
            let tierDiv = document.createElement("div");
            tierDiv.classList.add("tier-option");
            tierDiv.innerHTML = `Тир ${variant["Тир"]}`;

            tierDiv.addEventListener("click", function () {
                artifact["Тир"] = variant["Тир"];
                showArtifactStats(variant);
                updateSelectedList();
            });

            tierSelectionDiv.appendChild(tierDiv);
        });
    }

    // Отображение характеристик выбранного тира
    function showArtifactStats(variant) {
        statsDiv.innerHTML = "<h4>Характеристики:</h4>";
        for (let key in variant) {
            if (key !== "Имя" && key !== "Тир" && variant[key] !== null) {
                statsDiv.innerHTML += `<p>${key}: ${variant[key]}</p>`;
            }
        }
    }

    // Автоматический расчёт характеристик
    function calculateStats() {
        fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "artifacts": selectedArtifacts })
        })
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(error => console.error("❌ Ошибка при расчёте:", error));
    }

    // Вывод результатов
    function displayResults(stats) {
        resultDiv.innerHTML = "<h3>Результаты:</h3>";
        for (let stat in stats) {
            resultDiv.innerHTML += `<p>${stat}: ${stats[stat]}</p>`;
        }
    }
});