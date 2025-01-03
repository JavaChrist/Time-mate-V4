document.addEventListener('DOMContentLoaded', function () {
  // Met à jour le tableau des activités en utilisant les données de localStorage
  const updateActivitiesTable = () => {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const activitiesLog = document.getElementById('activities-log');
    const tableBody = activitiesLog.querySelector('tbody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Effacer les lignes existantes

    activities.forEach(activity => {
      const row = tableBody.insertRow();

      // Cellule pour la checkbox
      const checkboxCell = row.insertCell(0);
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('select-activity');
      checkbox.setAttribute('data-activity-id', activity.id);
      checkboxCell.appendChild(checkbox);

      // Cellule pour le nom
      const nameCell = row.insertCell(1);
      nameCell.textContent = activity.activityName;

      // Calcul des heures prévues totales
      const plannedHours = parseFloat(activity.totalHours || 0);
      const plannedHoursCell = row.insertCell(2);
      plannedHoursCell.textContent = plannedHours.toFixed(2);

      // Calcul des heures réalisées totales
      const realizedHours = parseFloat(activity.realizedHours || 0);
      const realizedHoursCell = row.insertCell(3);
      realizedHoursCell.textContent = realizedHours.toFixed(2);

      // Calcul des heures restantes
      const remainingHours = plannedHours - realizedHours;
      const remainingHoursCell = row.insertCell(4);
      remainingHoursCell.textContent = remainingHours.toFixed(2);
    });
  };

  // Ajoute un écouteur d'événement pour supprimer les activités sélectionnées
  const deleteSelectedActivities = () => {
    const selectedCheckboxes = document.querySelectorAll('.select-activity:checked');
    const activities = JSON.parse(localStorage.getItem('activities'));
    const remainingActivities = activities.filter(activity =>
      ![...selectedCheckboxes].some(checkbox => checkbox.getAttribute('data-activity-id') === activity.id)
    );

    localStorage.setItem('activities', JSON.stringify(remainingActivities));
    updateActivitiesTable();
  };

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', deleteSelectedActivities);
  }

  // Charge les activités au chargement initial de la page
  updateActivitiesTable();

  // Mise à jour du tableau lorsque le stockage local est modifié
  window.addEventListener('storage', function (event) {
    if (event.key === 'activities') {
      updateActivitiesTable();
    }
  });
});

// Fonction pour exporter en Excel
function exportToExcel() {
  try {
    // Récupérer le tableau par son ID
    const table = document.getElementById('activities-log');
    if (!table) {
      throw new Error("Le tableau n'a pas été trouvé");
    }

    // Créer un classeur Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(table);

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Activités");

    // Générer et télécharger le fichier
    XLSX.writeFile(wb, "activites.xlsx");
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    alert("Une erreur est survenue lors de l'export Excel");
  }
}

// Fonction pour exporter en PDF
function exportToPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const table = document.getElementById('activities-log');

    if (!table) {
      throw new Error("Le tableau n'a pas été trouvé");
    }

    html2canvas(table).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('activites.pdf');
    });
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    alert("Une erreur est survenue lors de l'export PDF");
  }
}
