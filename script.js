document.getElementById('ingredients-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const checkboxes = document.querySelectorAll('input[name="ingredient"]:checked');
  const selectedItems = Array.from(checkboxes).map(cb => cb.value);

  const response = await fetch('data/mockdata.json');
  const data = await response.json();

  let html = '<table><tr><th>Butik</th><th>Totalpris</th></tr>';

  data.butiker.forEach(butik => {
    let total = 0;
    selectedItems.forEach(item => {
      const vara = butik.varor.find(v => v.namn === item);
      if (vara) total += vara.pris;
    });
    html += `<tr><td>${butik.namn}</td><td>${total.toFixed(2)} kr</td></tr>`;
  });

  html += '</table>';
  document.getElementById('results').innerHTML = html;
});
