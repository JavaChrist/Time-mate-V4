document.addEventListener('DOMContentLoaded', function () {
    let isIntentionalLogout = false;
    let isIntentionalNavigation = false;
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetModalFields);
    }

    // Vérification de l'authentification
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
            window.location.replace('./index.html');
            return;
        }
    });

    // Gestion du bouton de déconnexion
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            isIntentionalLogout = true;
            firebase.auth().signOut().then(() => {
                window.location.href = './index.html';
            }).catch((error) => {
                console.error('Erreur lors de la déconnexion:', error);
                isIntentionalLogout = false;
            });
        });
    }

    // Gestion du bouton "Retour au tableau"
    const backButton = document.querySelector('button[onclick="location.href=\'activites.html\'"]');
    if (backButton) {
        backButton.onclick = function (e) {
            e.preventDefault();
            isIntentionalNavigation = true;
            window.location.href = 'activites.html';
        };
    }

    let currentViewDate = new Date();
    const openModalButton = document.getElementById('openModal');
    const modal = document.getElementById('modal');
    const closeModalSpan = document.querySelector('.close');
    const saveEventButton = document.getElementById('save-event');

    if (openModalButton) {
        openModalButton.addEventListener('click', function () {
            modal.style.display = 'block';
            resetModalFields();
        });
    }

    if (closeModalSpan) {
        closeModalSpan.addEventListener('click', function () {
            modal.style.display = 'none';
            resetModalFields();
        });
    }

    // Fermer le modal si l'utilisateur clique en dehors
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Réinitialiser les champs de la modale
    function resetModalFields() {
        const fieldsToReset = [
            'activity-name',
            'activity-time-start-1',
            'activity-time-end-1',
            'activity-time-start-2',
            'activity-time-end-2',
            'activity-start-date',
            'activity-end-date',
            'activity-color',
            'activity-realized-time'
        ];

        fieldsToReset.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                // Réinitialiser la valeur en fonction du type de champ
                if (fieldId === 'activity-color') {
                    element.value = '#ff0000';
                } else {
                    element.value = '';
                }
                // Réactiver le champ si nécessaire
                element.disabled = false;
            }
        });

        // Gérer le bouton de sauvegarde
        const saveButton = document.getElementById('save-event');
        if (saveButton) {
            saveButton.removeAttribute('data-activity-id');
            saveButton.removeAttribute('data-activity-date');
        }

        // Gérer Flatpickr si présent
        const datePicker = document.getElementById('activity-dates')?._flatpickr;
        if (datePicker) {
            datePicker.clear();
        }
    }

    // Ouvrir une activité existante pour modification
    function openActivityForEdit(activityId, date) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const activity = activities.find(a => a.id === activityId);
        const detail = activity?.activitiesDetails.find(d => d.date === date);

        if (activity && detail) {
            const modal = document.getElementById('modal');
            if (!modal) return; // Vérification de l'existence de la modale

            // Vérifier et définir les valeurs seulement si les éléments existent
            const elements = {
                'activity-name': activity.activityName,
                'activity-time-start-1': detail.startTime,
                'activity-time-end-1': detail.endTime,
                'activity-color': detail.color,
                'activity-realized-time': ''
            };

            // Mettre à jour les champs s'ils existent
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                    if (id === 'activity-name') {
                        element.disabled = true;
                    }
                }
            });

            // Gérer les dates avec Flatpickr
            const datePicker = document.getElementById('activity-dates')._flatpickr;
            if (datePicker) {
                datePicker.setDate(date);
                datePicker.config.disable = []; // Réinitialiser les dates désactivées
            }

            // Désactiver les champs qui ne doivent pas être modifiés
            const fieldsToDisable = [
                'activity-name',
                'activity-color',
                'activity-time-start-2',
                'activity-time-end-2'
            ];

            fieldsToDisable.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.disabled = true;
                }
            });

            // Définir les attributs data pour le bouton de sauvegarde
            const saveButton = document.getElementById('save-event');
            if (saveButton) {
                saveButton.setAttribute('data-activity-id', activityId);
                saveButton.setAttribute('data-activity-date', date);
            }

            // Afficher la modale
            modal.style.display = 'block';
        }
    }

    // Ajouter un bouton de suppression pour les activités dans le calendrier
    function addDeleteButton(activityElement, activityId, activityDate) {
        const deleteButton = document.createElement('span');
        deleteButton.textContent = '✖';
        deleteButton.classList.add('delete-activity-btn');

        deleteButton.addEventListener('click', function (event) {
            event.stopPropagation(); // Empêche d'ouvrir la modale lors du clic sur supprimer
            if (confirm('Voulez-vous vraiment supprimer cette activité ?')) {
                removeActivityFromDay(activityId, activityDate);
                loadActivitiesFromStorage(currentViewDate);
            }
        });

        activityElement.appendChild(deleteButton);
    }

    // Supprimer une activité d'une journée spécifique
    function removeActivityFromDay(activityId, activityDate) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const updatedActivities = activities.map(activity => {
            if (activity.id === activityId) {
                // Trouver le détail de l'activité à supprimer
                const detailIndex = activity.activitiesDetails.findIndex(detail => detail.date === activityDate);

                if (detailIndex !== -1) {
                    const detailToRemove = activity.activitiesDetails[detailIndex];

                    // Calculer les heures prévues pour cette entrée
                    const startTime = new Date(`1970-01-01T${detailToRemove.startTime}`);
                    const endTime = new Date(`1970-01-01T${detailToRemove.endTime}`);
                    const plannedHoursForDay = (endTime - startTime) / (1000 * 3600);

                    // Mettre à jour les heures totales prévues
                    activity.totalHours = (parseFloat(activity.totalHours) - plannedHoursForDay).toFixed(2);

                    // Mettre à jour les heures réalisées si elles existent
                    if (detailToRemove.realizedTime) {
                        activity.realizedHours = (parseFloat(activity.realizedHours || 0) - detailToRemove.realizedTime).toFixed(2);
                    }

                    // Supprimer uniquement l'activité spécifique
                    activity.activitiesDetails.splice(detailIndex, 1);
                }

                // Si plus aucun détail n'existe, supprimer l'activité complètement
                if (activity.activitiesDetails.length === 0) {
                    return null;
                }
            }
            return activity;
        }).filter(activity => activity !== null); // Supprimer les activités nulles

        localStorage.setItem('activities', JSON.stringify(updatedActivities));
        updateActivitiesTable(); // Mettre à jour le tableau des activités
    }

    // Sauvegarder une nouvelle activité ou une modification
    saveEventButton.addEventListener('click', function () {
        const activityId = saveEventButton.getAttribute('data-activity-id');
        const activityName = document.getElementById('activity-name').value;
        const startTimes = [
            document.getElementById('activity-time-start-1').value,
            document.getElementById('activity-time-start-2').value
        ];
        const endTimes = [
            document.getElementById('activity-time-end-1').value,
            document.getElementById('activity-time-end-2').value
        ];
        const startDateValue = document.getElementById('activity-start-date')?.value;
        const endDateValue = document.getElementById('activity-end-date')?.value;
        const color = document.getElementById('activity-color').value;
        const realizedTime = parseFloat(document.getElementById('activity-realized-time').value) || 0;

        // Si c'est une modification d'activité existante
        if (activityId) {
            const date = saveEventButton.getAttribute('data-activity-date');
            if (date && startTimes[0] && endTimes[0]) {
                updateActivityDetail(activityId, date, startTimes[0], endTimes[0], realizedTime, color);
                modal.style.display = 'none';
                resetModalFields();
                return;
            }
        }

        // Si c'est une nouvelle activité
        if (!activityName || !startDateValue || !startTimes.some((time, index) => time && endTimes[index])) {
            alert('Veuillez remplir au moins le nom et une plage horaire complète.');
            return;
        }

        const startDate = new Date(startDateValue);
        saveNewActivity(activityName, startDate, endDateValue, startTimes, endTimes, color, realizedTime);

        loadActivitiesFromStorage(currentViewDate);
        updateActivitiesTable();
        updateActivityNamesList();
        modal.style.display = 'none';
        resetModalFields();
    });

    // Mettre à jour les détails d'une activité existante
    function updateActivityDetail(activityId, date, startTime, endTime, realizedTime, color) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const activityIndex = activities.findIndex(a => a.id === activityId);

        if (activityIndex !== -1) {
            const activity = activities[activityIndex];
            const detailIndex = activity.activitiesDetails.findIndex(d => d.date === date);

            if (detailIndex !== -1) {
                const oldDetail = activity.activitiesDetails[detailIndex];
                const newRealizedTime = parseFloat(realizedTime || 0);

                // Calculer les heures prévues pour ce détail spécifique
                const startTimeDate = new Date(`1970-01-01T${startTime}`);
                const endTimeDate = new Date(`1970-01-01T${endTime}`);
                const plannedHours = ((endTimeDate - startTimeDate) / (1000 * 3600)).toFixed(2);

                // Calculer le total des heures réalisées pour ce détail
                const totalRealizedForDetail = (parseFloat(oldDetail.realizedTime || 0) + newRealizedTime).toFixed(2);

                // Mettre à jour les heures réalisées totales de l'activité
                activity.realizedHours = (parseFloat(activity.realizedHours || 0) + newRealizedTime).toFixed(2);

                // Vérifier si ce détail spécifique est terminé
                if (parseFloat(totalRealizedForDetail) >= parseFloat(plannedHours)) {
                    // Supprimer uniquement ce détail du calendrier
                    activity.activitiesDetails.splice(detailIndex, 1);
                } else {
                    // Mettre à jour les heures réalisées pour ce détail
                    activity.activitiesDetails[detailIndex] = {
                        ...oldDetail,
                        realizedTime: totalRealizedForDetail
                    };
                }

                // Sauvegarder les modifications
                activities[activityIndex] = activity;
                localStorage.setItem('activities', JSON.stringify(activities));

                // Fermer la modale
                const modal = document.getElementById('modal');
                if (modal) {
                    modal.style.display = 'none';
                }

                // Réinitialiser le champ des heures réalisées
                document.getElementById('activity-realized-time').value = '';

                // Mettre à jour l'affichage
                loadActivitiesFromStorage(currentViewDate);
                updateActivitiesTable();
            }
        }
    }

    // Sauvegarder une nouvelle activité
    function saveNewActivity(activityName, startDate, endDateValue, startTimes, endTimes, color, realizedTime) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const endDate = new Date(endDateValue);

        // Régler les heures à midi pour éviter les problèmes de fuseau horaire
        startDate.setHours(12, 0, 0, 0);
        endDate.setHours(12, 0, 0, 0);

        const dayDifference = Math.round((endDate - startDate) / (1000 * 3600 * 24));

        // Calculer les heures prévues totales pour toutes les plages
        let totalPlannedHours = 0;
        startTimes.forEach((startTime, index) => {
            if (startTime && endTimes[index]) {
                const start = new Date(`1970-01-01T${startTime}`);
                const end = new Date(`1970-01-01T${endTimes[index]}`);
                totalPlannedHours += ((end - start) / (1000 * 3600));
            }
        });
        totalPlannedHours = totalPlannedHours * (dayDifference + 1);

        // Chercher si une activité avec le même nom existe déjà
        const existingActivityIndex = activities.findIndex(a => a.activityName === activityName);

        if (existingActivityIndex !== -1) {
            // Si l'activité existe, ajouter les nouveaux détails
            const existingActivity = activities[existingActivityIndex];

            // Ajouter les nouveaux détails d'activité
            for (let i = 0; i <= dayDifference; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                // Créer un tableau de plages horaires pour cette date
                const timeSlots = [];
                startTimes.forEach((startTime, index) => {
                    if (startTime && endTimes[index]) {
                        timeSlots.push({
                            startTime: startTime,
                            endTime: endTimes[index],
                            color: color,
                            realizedTime: 0
                        });
                    }
                });

                // Ajouter chaque plage horaire comme un détail séparé
                timeSlots.forEach(slot => {
                    existingActivity.activitiesDetails.push({
                        date: dateStr,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        color: color,
                        realizedTime: 0
                    });
                });
            }

            existingActivity.totalHours = (parseFloat(existingActivity.totalHours) + totalPlannedHours).toFixed(2);
            activities[existingActivityIndex] = existingActivity;

        } else {
            // Si l'activité n'existe pas, créer une nouvelle entrée
            let activitiesDetails = [];

            for (let i = 0; i <= dayDifference; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                // Ajouter chaque plage horaire valide
                startTimes.forEach((startTime, index) => {
                    if (startTime && endTimes[index]) {
                        activitiesDetails.push({
                            date: dateStr,
                            startTime: startTime,
                            endTime: endTimes[index],
                            color: color,
                            realizedTime: 0
                        });
                    }
                });
            }

            const newActivity = {
                id: generateUniqueId(),
                activityName,
                totalHours: totalPlannedHours.toFixed(2),
                realizedHours: 0,
                activitiesDetails
            };

            activities.push(newActivity);
        }

        localStorage.setItem('activities', JSON.stringify(activities));
    }

    // Charger et afficher les activités depuis le stockage local
    function loadActivitiesFromStorage(currentDate = new Date()) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const dayMapping = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);

        // Met à jour uniquement calendar-header
        const calendarHeader = document.querySelector('.calendar-header');
        calendarHeader.innerHTML = '';

        dayMapping.forEach((day, index) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + index);
            const formattedDate = dayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', day);
            dayElement.innerHTML = `<span class="day-title">${dayNames[index]}</span> - <span class="date-display">${formattedDate}</span>`;

            calendarHeader.appendChild(dayElement);
        });

        // Efface les doublons dans calendar-body
        dayMapping.forEach(day => {
            const dayContainer = document.getElementById(day);
            if (dayContainer) {
                dayContainer.innerHTML = ''; // Nettoie les activités uniquement
            }
        });

        activities.forEach(activity => {
            activity.activitiesDetails.forEach(detail => {
                const activityDate = new Date(detail.date);
                const dayOfWeek = activityDate.getDay();
                const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const dayContainer = document.getElementById(dayMapping[adjustedDayOfWeek]);

                if (isDateInCurrentView(activityDate, currentDate)) {
                    const activityElement = document.createElement('div');
                    activityElement.classList.add('activity');
                    activityElement.style.backgroundColor = detail.color;
                    activityElement.setAttribute('data-activity-id', activity.id);
                    activityElement.setAttribute('data-activity-date', detail.date);

                    // Calculer les heures prévues et restantes
                    const startTime = new Date(`1970-01-01T${detail.startTime}`);
                    const endTime = new Date(`1970-01-01T${detail.endTime}`);
                    const plannedHours = ((endTime - startTime) / (1000 * 3600)).toFixed(2);
                    const remainingHours = (plannedHours - (detail.realizedTime || 0)).toFixed(2);

                    activityElement.innerHTML = `
                        <span class="activity-name">${activity.activityName}</span>
                        <span class="activity-time">${detail.startTime} - ${detail.endTime}</span>
                        <span class="activity-hours">(${remainingHours}h restantes)</span>
                    `;

                    // Ajouter l'événement de clic pour ouvrir la modale
                    activityElement.addEventListener('click', function () {
                        openActivityForEdit(activity.id, detail.date);
                    });

                    // Ajouter le bouton de suppression
                    addDeleteButton(activityElement, activity.id, detail.date);

                    dayContainer.appendChild(activityElement);
                }
            });
        });
    }

    // Mettre à jour le tableau des activités
    function updateActivitiesTable() {
        const activitiesLog = document.getElementById('activities-log');
        if (!activitiesLog) return;

        const tableBody = activitiesLog.querySelector('tbody');
        if (!tableBody) return;

        // Récupérer les activités actuelles et l'historique
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const historique = JSON.parse(localStorage.getItem('historique')) || [];

        // Créer un objet pour stocker les totaux par nom d'activité
        const activityTotals = {};

        // Calculer les totaux pour les activités en cours
        activities.forEach(activity => {
            const name = activity.activityName;
            if (!activityTotals[name]) {
                activityTotals[name] = {
                    plannedHours: 0,
                    realizedHours: 0
                };
            }

            // Ajouter les heures prévues pour chaque détail
            activity.activitiesDetails.forEach(detail => {
                const startTime = new Date(`1970-01-01T${detail.startTime}`);
                const endTime = new Date(`1970-01-01T${detail.endTime}`);
                const plannedHours = (endTime - startTime) / (1000 * 3600);

                activityTotals[name].plannedHours += plannedHours;
                activityTotals[name].realizedHours += parseFloat(detail.realizedTime || 0);
            });
        });

        // Ajouter ou mettre à jour avec les données de l'historique
        historique.forEach(historyItem => {
            const name = historyItem.activityName;
            if (!activityTotals[name]) {
                activityTotals[name] = {
                    plannedHours: parseFloat(historyItem.totalHours || 0),
                    realizedHours: parseFloat(historyItem.realizedHours || 0)
                };
            } else {
                // Conserver les heures prévues existantes et ajouter les heures réalisées
                activityTotals[name].realizedHours += parseFloat(historyItem.realizedHours || 0);
            }
        });

        // Vider le tableau
        tableBody.innerHTML = '';

        // Remplir le tableau avec les totaux
        Object.entries(activityTotals).forEach(([name, totals]) => {
            const row = tableBody.insertRow();

            // Case à cocher
            const checkboxCell = row.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('select-activity');
            checkbox.setAttribute('data-activity-name', name);
            checkboxCell.appendChild(checkbox);

            // Nom de l'activité
            const nameCell = row.insertCell(1);
            nameCell.textContent = name;

            // Heures prévues (toujours conservées)
            const plannedHoursCell = row.insertCell(2);
            plannedHoursCell.textContent = totals.plannedHours.toFixed(2);

            // Heures réalisées (cumul des heures saisies)
            const realizedHoursCell = row.insertCell(3);
            realizedHoursCell.textContent = totals.realizedHours.toFixed(2);

            // Heures restantes (différence entre prévues et réalisées)
            const remainingHoursCell = row.insertCell(4);
            const remainingHours = Math.max(0, totals.plannedHours - totals.realizedHours);
            remainingHoursCell.textContent = remainingHours.toFixed(2);
        });
    }

    // Générer un identifiant unique pour chaque activité
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Déterminer si une date est dans la semaine affichée
    function isDateInCurrentView(activityDate, currentDate) {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Créer une nouvelle date avec l'heure à midi
        const compareDate = new Date(activityDate);
        compareDate.setHours(12, 0, 0, 0);

        return compareDate >= startOfWeek && compareDate <= endOfWeek;
    }

    const nextWeekButton = document.getElementById('next-week');
    const previousWeekButton = document.getElementById('previous-week');

    nextWeekButton.addEventListener('click', function () {
        adjustWeek(7);
    });

    previousWeekButton.addEventListener('click', function () {
        adjustWeek(-7);
    });

    function adjustWeek(days) {
        currentViewDate.setDate(currentViewDate.getDate() + days);
        displayWeekNumber(currentViewDate);
        loadActivitiesFromStorage(currentViewDate);
    }

    function displayWeekNumber(date) {
        const weekNumber = moment(date).isoWeek();
        const weekStart = moment(date).startOf('isoWeek').format('DD/MM');
        const weekEnd = moment(date).endOf('isoWeek').format('DD/MM');
        const weekNumberContainer = document.getElementById('week-number');
        weekNumberContainer.textContent = `Semaine ${weekNumber} (${weekStart} - ${weekEnd})`;
    }

    displayWeekNumber(currentViewDate);
    loadActivitiesFromStorage(currentViewDate);
    updateActivitiesTable();
    updateActivityNamesList();

    function updateActivityNamesList() {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const historique = JSON.parse(localStorage.getItem('historique')) || [];

        // Combiner les noms des activités actuelles et de l'historique
        const allNames = new Set([
            ...activities.map(activity => activity.activityName),
            ...historique.map(item => item.activityName)
        ]);

        const activityNameInput = document.getElementById('activity-name');
        if (!activityNameInput) return;

        const namesContainer = document.createElement('div');
        namesContainer.id = 'names-container';
        namesContainer.classList.add('names-container');

        allNames.forEach(name => {
            const nameItem = document.createElement('div');
            nameItem.classList.add('name-item');

            const nameText = document.createElement('span');
            nameText.textContent = name;
            nameText.classList.add('name-text');

            // Ajouter le bouton X
            const deleteButton = document.createElement('span');
            deleteButton.textContent = '✖';
            deleteButton.classList.add('delete-name-button');

            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Voulez-vous vraiment supprimer ce nom de la liste ?')) {
                    const historique = JSON.parse(localStorage.getItem('historique')) || [];
                    const updatedHistorique = historique.filter(item => item.activityName !== name);
                    localStorage.setItem('historique', JSON.stringify(updatedHistorique));

                    nameItem.remove();
                    if (namesContainer.children.length === 0) {
                        namesContainer.style.display = 'none';
                    }
                }
            });

            nameItem.appendChild(nameText);
            nameItem.appendChild(deleteButton);

            // Sélectionner le nom (uniquement sur clic du texte)
            nameText.addEventListener('click', () => {
                activityNameInput.value = name;
                namesContainer.style.display = 'none';
            });

            namesContainer.appendChild(nameItem);
        });

        const oldContainer = document.getElementById('names-container');
        if (oldContainer) {
            oldContainer.remove();
        }

        const inputContainer = activityNameInput.parentElement;
        inputContainer.classList.add('input-container');
        inputContainer.appendChild(namesContainer);

        activityNameInput.addEventListener('focus', () => {
            if (namesContainer.children.length > 0) {
                namesContainer.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!namesContainer.contains(e.target) && e.target !== activityNameInput) {
                namesContainer.style.display = 'none';
            }
        });

        activityNameInput.addEventListener('input', () => {
            const searchText = activityNameInput.value.toLowerCase();
            Array.from(namesContainer.children).forEach(item => {
                const nameText = item.firstChild.textContent.toLowerCase();
                item.style.display = nameText.includes(searchText) ? 'flex' : 'none';
            });
            namesContainer.style.display = 'block';
        });
    }

    // Initialiser Flatpickr
    const datePicker = flatpickr("#activity-dates", {
        mode: "multiple",
        dateFormat: "d/m",
        locale: "fr",
        minDate: "today",
        weekNumbers: true,
        shorthandCurrentMonth: true,
        showMonths: 1,
        altInput: true,
        altFormat: "d/m",
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                selectedDates.sort((a, b) => a - b);

                // Ajuster les dates pour éviter le décalage de fuseau horaire
                const startDate = new Date(selectedDates[0]);
                const endDate = new Date(selectedDates[selectedDates.length - 1]);

                // Régler l'heure à midi pour éviter les problèmes de fuseau horaire
                startDate.setHours(12, 0, 0, 0);
                endDate.setHours(12, 0, 0, 0);

                let startDateInput = document.getElementById('activity-start-date');
                let endDateInput = document.getElementById('activity-end-date');

                if (!startDateInput) {
                    startDateInput = document.createElement('input');
                    startDateInput.type = 'hidden';
                    startDateInput.id = 'activity-start-date';
                    document.getElementById('activity-form').appendChild(startDateInput);
                }

                if (!endDateInput) {
                    endDateInput = document.createElement('input');
                    endDateInput.type = 'hidden';
                    endDateInput.id = 'activity-end-date';
                    document.getElementById('activity-form').appendChild(endDateInput);
                }

                // Format YYYY-MM-DD avec gestion du fuseau horaire
                startDateInput.value = startDate.toISOString().split('T')[0];
                endDateInput.value = endDate.toISOString().split('T')[0];
            }
        }
    });

    // Ajouter la gestion du menu hamburger
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // Fermer le menu quand on clique sur un lien
    document.querySelectorAll('.nav button').forEach(button => {
        button.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        });
    });

    // Fermer le menu quand on clique en dehors
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
});
