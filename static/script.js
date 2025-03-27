document.addEventListener("DOMContentLoaded", function () {
    let selectedArtifacts = [];

    const artifactSelect = document.getElementById("artifact-select");
    const confirmButton = document.getElementById("confirm-artifact");
    const statsDiv = document.getElementById("artifact-stats");
    const artifactNameHeader = document.getElementById("artifact-name");
    const tierSelectionDiv = document.getElementById("tier-selection");
    const resultDiv = document.getElementById("calculation-result");
    const selectedArtifactsList = document.getElementById("selected-artifacts");
	const saveButton = document.getElementById("save-build");
	const loadButton = document.getElementById("load-build");
    const clearButton = document.getElementById("clear-build");
	const artifactCount = document.getElementById("artifact-count");

    let allArtifacts = [];

    // Подсказки для результатов
    const tooltips = {
        "Вывод радиации": "Радиация,которая выводиться за счет свойств артефактов",
        "Накопление радиации": "Радиация, которая поступает в организм при срабатывании артефактов",
        "Защита от ударов": "Снижает урон от атак мутантов и ближнего боя",
        "Защита от аномалий": "Снижает урон, получаемый в аномалиях",
        "Защита от пуль": "Уменьшает урон от огнестрельного оружия",
        "Температура": "Лучше поддерживать этот параметр в золотой середине (около 0), чтобы избежать перегрева или переохлаждения",
        "Кровь": "Восполняет запас крови",
        "Выносливость": "Положительное значение – восстанавливает запас выносливости. Отрицательное значение – снижает её",
        "Стойкость": "Если стойкость падает ниже определенного значения (уходит в минус), персонаж начинает терять сознание или видеть потемнения в глазах",
        "Здоровье": "Если показатель идет в плюс, здоровье персонажа постепенно восстанавливается до 100%. Один из важнейших параметров",
        "Вода": "Если показатель идет в плюс, персонаж постоянно получает восстановление воды после срабатывания артефакта",
        "Еда": "Если показатель идет в плюс, персонаж постоянно получает восстановление еды после срабатывания артефакта",
        "Шанс на порез": "Повышает вероятность получить порез",
        "Лечение порезов": "Затягивает порезы",
        "Шанс перелома": "Увеличивает вероятность сломать кость",
        "Лечение переломов": "Восстанавливает сломанные кости",
        "Высота прыжка": "Позволяет персонажу прыгать выше. Имеет ограничение по максимальной высоте, но может быть полезным в некоторых ситуациях"  
    };

    // Загрузка артефактов
    fetch("/get_artifacts")
        .then(response => response.json())
        .then(data => {
            allArtifacts = data;
            console.log("✅ Загруженные артефакты:", allArtifacts);

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
		
		// Очистка сборки
    clearButton.addEventListener("click", function () {
        selectedArtifacts = [];
        updateSelectedList();
        artifactNameHeader.innerHTML = "Выберите артефакт из списка";
        tierSelectionDiv.innerHTML = "Здесь появится выбор тира...";
        statsDiv.innerHTML = "Характеристики появятся после выбора тира...";
        calculateStats();
    });

    // Сохранение сборки в localStorage
    saveButton.addEventListener("click", function () {
        if (selectedArtifacts.length > 0) {
            localStorage.setItem("savedBuild", JSON.stringify(selectedArtifacts));
            alert("Сборка сохранена!");
        } else {
            alert("Нет артефактов для сохранения.");
        }
    });

    // Загрузка сборки из localStorage
    loadButton.addEventListener("click", function () {
        const savedBuild = localStorage.getItem("savedBuild");
        if (savedBuild) {
            selectedArtifacts = JSON.parse(savedBuild);
            updateSelectedList();
            alert("Сборка загружена!");
        } else {
            alert("Нет сохранённых сборок.");
        }
    });
   
    // Очистка сборки
    clearButton.addEventListener("click", function () {
        selectedArtifacts = [];
        updateSelectedList();
        artifactNameHeader.innerHTML = "Выберите артефакт из списка";
        tierSelectionDiv.innerHTML = "Здесь появится выбор тира...";
        statsDiv.innerHTML = "Характеристики появятся после выбора тира...";
    });

    // Добавление артефакта в список (разрешает дубликаты)
    function addArtifact(name) {
        const artifactId = Date.now() + Math.random();
        selectedArtifacts.push({ id: artifactId, name: name, tier: null });
        updateSelectedList();
    }

    // Копирование артефакта
    function copyArtifact(originalArtifact) {
        if (!originalArtifact.tier) {
            console.log("⚠️ Нельзя копировать артефакт без выбранного тира.");
            return;
        }
        const copiedArtifact = {
            id: Date.now() + Math.random(),
            name: originalArtifact.name,
            tier: originalArtifact.tier
        };
        selectedArtifacts.push(copiedArtifact);
        updateSelectedList();
    }

    // Обновление списка выбранных артефактов
function updateSelectedList() {
    if (!selectedArtifactsList) {
        console.error("❌ Ошибка: элемент selectedArtifactsList не найден!");
        return;
    }

    selectedArtifactsList.innerHTML = "";

    selectedArtifacts.forEach((artifact) => {
        let listItem = document.createElement("li");
        listItem.classList.add("artifact-item");

        let artifactContainer = document.createElement("div");
        artifactContainer.classList.add("artifact-container");
        artifactContainer.onclick = function () {
            showTierSelection(artifact);
        };

        let artifactText = document.createElement("span");
        artifactText.innerHTML = `${artifact.name} (${artifact.tier ? "Тир " + artifact.tier : "Выберите тир"})`;
        artifactText.classList.add("clickable");

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        // Кнопка удаления артефакта
        let removeButton = document.createElement("span");
        removeButton.textContent = "✖️";
        removeButton.classList.add("remove-btn");
        removeButton.onclick = function (event) {
            event.stopPropagation();
            selectedArtifacts = selectedArtifacts.filter(a => a.id !== artifact.id);
            updateSelectedList();
            artifactNameHeader.innerHTML = "Выберите артефакт из списка";
            tierSelectionDiv.innerHTML = "Здесь появится выбор тира...";
            statsDiv.innerHTML = "Характеристики появятся после выбора тира...";
            calculateStats();
        };

        // Кнопка копирования артефакта
        let copyButton = document.createElement("span");
        copyButton.textContent = "📄";
        copyButton.classList.add("copy-btn");
        copyButton.onclick = function (event) {
            event.stopPropagation();
            if (typeof copyArtifact === "function") {
                copyArtifact(artifact);
            } else {
                console.error("❌ Ошибка: copyArtifact() не найдена!");
            }
        };

        buttonContainer.appendChild(removeButton);
        buttonContainer.appendChild(copyButton);

        artifactContainer.appendChild(artifactText);
        listItem.appendChild(artifactContainer);
        listItem.appendChild(buttonContainer);
        selectedArtifactsList.appendChild(listItem);
    });

    // Обновление количества артефактов
    const countElement = document.getElementById("artifact-count");
    if (countElement) {
        countElement.textContent = `Количество артефактов: ${selectedArtifacts.length}`;
    } else {
        console.warn("⚠️ Элемент #artifact-count не найден!");
    }

    calculateStats();
}

    // Отображение тиров и характеристик
    function showTierSelection(artifact) {
        let artifactData = allArtifacts.find(a => a["Имя"] === artifact.name);
        if (!artifactData) return;

        artifactNameHeader.innerHTML = artifact.name;
        tierSelectionDiv.innerHTML = `<h4>Выберите тир:</h4>`;
        statsDiv.innerHTML = "Характеристики появятся после выбора тира...";

        artifactData["Варианты"].forEach(variant => {
            let tierDiv = document.createElement("div");
            tierDiv.classList.add("tier-option");
            tierDiv.innerHTML = `Тир ${variant["Тир"]}`;

            // Подсветка выбранного тира зелёным
            if (artifact.tier === variant["Тир"]) {
                tierDiv.style.backgroundColor = "lightgreen";
            }

            tierDiv.addEventListener("click", function () {
                artifact.tier = variant["Тир"];
                showArtifactStats(variant);
                updateSelectedList();
            });

            tierSelectionDiv.appendChild(tierDiv);

            // Если тир уже выбран, сразу показать характеристики
            if (artifact.tier === variant["Тир"]) {
                showArtifactStats(variant);
            }
        });
    }

    // Отображение характеристик выбранного тира с кастомными tooltip
    function showArtifactStats(variant) {
        statsDiv.innerHTML = "<h4>Характеристики:</h4>";
        for (let key in variant) {
            if (key !== "Имя" && key !== "Тир" && variant[key] !== null) {
                let p = document.createElement("p");
                p.textContent = `${key}: ${variant[key]}`;
                if (tooltips[key]) {
                    // Создаем элемент tooltip
                    let tooltipSpan = document.createElement("span");
                    tooltipSpan.classList.add("tooltip");

                    // Иконка-триггер
                    let icon = document.createElement("span");
                    icon.classList.add("tooltip-icon");
                    icon.textContent = "?";

                    // Сам текст tooltip
                    let tooltipText = document.createElement("span");
                    tooltipText.classList.add("tooltiptext");
                    tooltipText.textContent = tooltips[key];

                    tooltipSpan.appendChild(icon);
                    tooltipSpan.appendChild(tooltipText);

                    p.appendChild(tooltipSpan);
                }
                statsDiv.appendChild(p);
            }
        }
    }

    // Автоматический расчёт характеристик
    function calculateStats() {
        if (selectedArtifacts.length === 0) {
            console.log("⚠️ Нет артефактов для расчёта, запрос не отправляется.");
            resultDiv.innerHTML = "<h3>Результаты:</h3><p>Выберите артефакты для расчёта.</p>";
            return;
        }

        console.log("📌 Отправляем данные на сервер:", JSON.stringify({ artifacts: selectedArtifacts }));

        fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artifacts: selectedArtifacts })
        })
        .then(response => {
            console.log("📌 Ответ сервера (статус):", response.status);
            return response.json();
        })
        .then(data => {
            console.log("✅ Ответ сервера:", data);
            displayResults(data);
        })
        .catch(error => console.error("❌ Ошибка запроса:", error));
    }

    // Вывод результатов с приоритетным порядком и окраской по условиям
    function displayResults(stats) {
        resultDiv.innerHTML = "<h3>Результаты:</h3>";

        const priorityOrder = ["Вывод радиации", "Накопление радиации"];
        let sortedStats = {};

        // Добавляем приоритетные свойства первыми
        priorityOrder.forEach(prop => {
            if (stats.hasOwnProperty(prop)) {
                sortedStats[prop] = stats[prop];
            }
        });

        // Добавляем остальные свойства в алфавитном порядке
        Object.keys(stats)
            .filter(key => !priorityOrder.includes(key))
            .sort()
            .forEach(key => {
                sortedStats[key] = stats[key];
            });

        // Отображаем результаты с окраской
        for (let key in sortedStats) {
            let value = sortedStats[key];
            let color = "black";

            if (value === 0) {
                color = "gray";
            } else {
                if (key === "Температура") {
                    if (value < 0) {
                        color = "blue";
                    } else if (value > 0) {
                        color = "red";
                    } else {
                        color = "green";
                    }
                } else if (key === "Шанс на порез" || key === "Шанс перелома" || key === "Накопление радиации") {
                    color = "red";
                } else {
                    color = value > 0 ? "green" : "red";
                }
            }

            if (key.startsWith("Стойкость")) {
                key = key.replace(" (не падать)", "");
            }

            let p = document.createElement("p");
            p.style.color = color;
            p.textContent = `${key}: ${value}`;
            // Добавляем tooltip для результатов, если описание задано
            if (tooltips[key]) {
                let tooltipSpan = document.createElement("span");
                tooltipSpan.classList.add("tooltip");

                let icon = document.createElement("span");
                icon.classList.add("tooltip-icon");
                icon.textContent = "?";

                let tooltipText = document.createElement("span");
                tooltipText.classList.add("tooltiptext");
                tooltipText.textContent = tooltips[key];

                tooltipSpan.appendChild(icon);
                tooltipSpan.appendChild(tooltipText);
                p.appendChild(tooltipSpan);
            }
            resultDiv.appendChild(p);
        }
    }
});