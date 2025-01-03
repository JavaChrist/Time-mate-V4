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
