// Uppdatera checkbox handlers för att aktivera/inaktivera select istället för att visa/dölja
document.getElementById("tortilla-checkbox").addEventListener("change", (e) => {
  const select = document.getElementById("tortilla-size");
  select.disabled = !e.target.checked;
  if (!e.target.checked) select.value = "";
});

document.getElementById("beef-checkbox").addEventListener("change", (e) => {
  const select = document.getElementById("beef-size");
  select.disabled = !e.target.checked;
  if (!e.target.checked) select.value = "";
});

document
  .getElementById("mixed-beef-checkbox")
  .addEventListener("change", (e) => {
    const select = document.getElementById("mixed-beef-size");
    select.disabled = !e.target.checked;
    if (!e.target.checked) select.value = "";
  });

// Funktion för att kontrollera om något är valt
function checkIfAnySelected() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const anyChecked = Array.from(checkboxes).some((cb) => cb.checked);
  const resetButton = document.getElementById("reset-button");

  if (anyChecked) {
    resetButton.classList.add("visible");
  } else {
    resetButton.classList.remove("visible");
  }
}

// Lägg till event listeners för alla checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", checkIfAnySelected);
});

// Funktion för att uppdatera listan över valda ingredienser med pris
async function updateSelectedItemsSummary(selectedItems) {
  const list = document.getElementById("selected-items-list");
  list.innerHTML = ""; // Rensa listan

  if (selectedItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Välj ingredienser för att se priser";
    emptyMessage.className = "fade-in";
    list.appendChild(emptyMessage);
    return;
  }

  // Hämta data från mockdata.json
  const response = await fetch("data/mockdata.json");
  if (!response.ok) {
    console.error("Kunde inte ladda mockdata.json");
    return;
  }
  const data = await response.json();

  selectedItems.forEach((item) => {
    let price = null;

    // Hitta priset för den valda ingrediensen i någon av butikerna
    for (const butik of data.butiker) {
      const vara = butik.varor.find((v) => v.namn === item);
      if (vara) {
        price = vara.pris;
        break;
      }
    }

    // Skapa en lista med ingrediens och pris
    const li = document.createElement("li");
    li.textContent = price
      ? `${item} - ${price.toFixed(2)} kr`
      : `${item} - Pris ej tillgängligt`;
    list.appendChild(li);
  });

  // Lägg till fade-in animation på resultaten
  list.classList.add("fade-in");
}

// Add loading state handling
function setLoading(isLoading) {
  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Laddar..." : "Jämför priser";
}

// Add error handling
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message fade-in";
  errorDiv.textContent = message;

  // Visa feedback icon
  const icon = document.createElement("span");
  icon.textContent = "❌ ";
  errorDiv.prepend(icon);

  document.getElementById("results").prepend(errorDiv);
  setTimeout(() => {
    errorDiv.style.opacity = "0";
    setTimeout(() => errorDiv.remove(), 300);
  }, 4700);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPriceClass(price, lowestPrice) {
  const diff = price - lowestPrice;
  const diffPercent = (diff / lowestPrice) * 100;

  if (diff === 0) return "best-price";
  if (diffPercent <= 10) return "medium-price";
  return "high-price";
}

// Validera val när checkbox ändras
function validateSelection(checkbox, selectId) {
  const select = document.getElementById(selectId);
  const errorDiv = document.querySelector(`#${selectId}-error`);

  if (checkbox.checked && !select.value) {
    select.classList.add("select-error");
    if (!errorDiv) {
      const error = document.createElement("div");
      error.id = `${selectId}-error`;
      error.className = "error-message";
      error.textContent = "Välj en mängd";
      select.parentNode.appendChild(error);
    }
    return false;
  }

  select.classList.remove("select-error");
  errorDiv?.remove();
  return true;
}

// Hantera formulärets inlämning
document
  .getElementById("ingredients-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validera alla required selections
    const validations = [
      { checkbox: "tortilla-checkbox", select: "tortilla-size" },
      { checkbox: "beef-checkbox", select: "beef-size" },
      { checkbox: "mixed-beef-checkbox", select: "mixed-beef-size" },
    ];

    const isValid = validations.every(({ checkbox, select }) => {
      const cb = document.getElementById(checkbox);
      return !cb.checked || validateSelection(cb, select);
    });

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const selectedItems = [];

      // Tortillabröd
      const tortillaCheckbox = document.getElementById("tortilla-checkbox");
      if (tortillaCheckbox.checked) {
        const dropdown = document.getElementById("tortilla-size");
        selectedItems.push(dropdown.value);
      }

      // Nötfärs
      const beefCheckbox = document.getElementById("beef-checkbox");
      if (beefCheckbox.checked) {
        const dropdown = document.getElementById("beef-size");
        selectedItems.push(dropdown.value);
      }

      // Blandfärs
      const mixedBeefCheckbox = document.getElementById("mixed-beef-checkbox");
      if (mixedBeefCheckbox.checked) {
        const dropdown = document.getElementById("mixed-beef-size");
        selectedItems.push(dropdown.value);
      }

      // Övriga markerade ingredienser
      const checkboxes = document.querySelectorAll(
        'input[name="ingredient"]:checked'
      );
      selectedItems.push(...Array.from(checkboxes).map((cb) => cb.value));

      // Uppdatera listan över valda ingredienser
      updateSelectedItemsSummary(selectedItems);

      // Hämta data från mockdata.json
      const response = await fetch("data/mockdata.json");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      // Beräkna priser för varje butik
      const butikPriser = data.butiker.map((butik) => {
        let total = 0;
        const varor = [];

        selectedItems.forEach((item) => {
          const vara = butik.varor.find((v) => v.namn === item);
          if (vara) {
            total += vara.pris;
            varor.push(vara);
          }
        });

        return {
          namn: butik.namn,
          total,
          varor: varor,
        };
      });

      // Sortera butikerna baserat på totalpris (billigast först)
      butikPriser.sort((a, b) => a.total - b.total);

      const lowestPrice = butikPriser[0].total;

      // Skapa HTML för den detaljerade tabellen
      let html = `
        <div class="last-updated">
          Priser uppdaterade: ${formatDate(data.lastUpdated)}
        </div>
        <table><tr><th>Butik</th><th>Vara</th><th>Pris</th></tr>`;

      butikPriser.forEach((butik, index) => {
        const priceClass = getPriceClass(butik.total, lowestPrice);
        const priceDiff = butik.total - lowestPrice;

        // Uppdaterad HTML-struktur för butiksraden
        html += `
          <tr class="butik-header ${priceClass}">
            <td>
              <strong>${butik.namn}</strong>
              <button class="toggle-details" data-store="${index}">
                <span class="arrow">↓</span> visa detaljer
              </button>
            </td>
            <td><strong>Totalt:</strong></td>
            <td>
              <strong>${butik.total.toFixed(2)} kr</strong>
              ${
                priceDiff > 0
                  ? `<div class="price-diff">(${priceDiff.toFixed(
                      2
                    )} kr dyrare)</div>`
                  : `<div class="price-diff savings">Bästa priset!</div>`
              }
            </td>
          </tr>`;

        // Lägg till detaljrader för varje vald vara
        selectedItems.forEach((item) => {
          const vara = butik.varor.find((v) => v.namn === item);
          if (vara) {
            html += renderPriceRow(vara, vara.pris);
          }
        });

        html +=
          '<tr class="separator details-content" style="display: none;"><td colspan="3"></td></tr>';
      });

      html += "</table>";

      // Uppdatera resultatsektionen
      document.getElementById("results").innerHTML = html;

      // Lägg till fade-in på resultaten
      document.getElementById("results").classList.add("fade-in");

      // Uppdaterad click handler för toggle-details
      document.querySelectorAll(".toggle-details").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const storeIndex = button.dataset.store;
          const parentRow = button.closest("tr");
          const detailRows = [];

          // Samla alla detaljrader fram till nästa butik-header
          let nextRow = parentRow.nextElementSibling;
          while (nextRow && !nextRow.classList.contains("butik-header")) {
            if (nextRow.classList.contains("details-content")) {
              detailRows.push(nextRow);
            }
            nextRow = nextRow.nextElementSibling;
          }

          // Toggla synlighet
          const isExpanded = button.classList.contains("expanded");
          detailRows.forEach((row) => {
            row.style.display = isExpanded ? "none" : "table-row";
          });

          button.classList.toggle("expanded");
          button.innerHTML = isExpanded
            ? `<span class="arrow">↓</span> visa detaljer`
            : `<span class="arrow">↑</span> dölj detaljer`;
        });
      });
    } catch (error) {
      showError("Ett fel uppstod: " + error.message);
      document.getElementById("results").innerHTML = "";
    } finally {
      setLoading(false);
    }
  });

// Uppdatera prisjämförelse-rendering för att inkludera kampanjpriser
function renderPriceRow(vara, pris) {
  const isCampaign = vara.kampanj;
  return `
    <tr class="vara-rad details-content" style="display: none;">
      <td></td>
      <td>${vara.namn}</td>
      <td class="${isCampaign ? "campaign-price" : ""}">${pris.toFixed(
    2
  )} kr</td>
    </tr>`;
}

// Hantera återställning av formuläret
document.getElementById("reset-button").addEventListener("click", () => {
  // Återställ formuläret
  document.getElementById("ingredients-form").reset();

  // Återställ select-menyer till disabled och standardvärde
  const selects = [
    { id: "tortilla-size", checkbox: "tortilla-checkbox" },
    { id: "beef-size", checkbox: "beef-checkbox" },
    { id: "mixed-beef-size", checkbox: "mixed-beef-checkbox" },
  ];

  selects.forEach(({ id, checkbox }) => {
    const select = document.getElementById(id);
    select.value = "";
    select.disabled = true;
    document.getElementById(checkbox).checked = false;
  });

  // Rensa resultatsektionen
  document.getElementById("results").innerHTML = "";

  // Dölj återställningsknappen
  document.getElementById("reset-button").classList.remove("visible");
});
