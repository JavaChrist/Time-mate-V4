document.addEventListener('DOMContentLoaded', function () {
    let isIntentionalLogout = false;

    // Vérification de l'authentification
    firebase.auth().onAuthStateChanged((user) => {
        if (!user && !isIntentionalLogout) {
            window.location.href = './index.html';
            return;
        }
    });

    // Gestion du bouton de déconnexion
    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        isIntentionalLogout = true;
        firebase.auth().signOut().then(() => {
            window.location.href = './index.html';
        }).catch((error) => {
            console.error('Erreur lors de la déconnexion:', error);
            isIntentionalLogout = false;
        });
    });

    // Déconnexion automatique uniquement lors de la fermeture de la fenêtre
    window.addEventListener('unload', () => {
        if (!isIntentionalLogout) {
            firebase.auth().signOut();
        }
    });

    let currentViewDate = new Date();
    const openModalButton = document.getElementById('openModal');

    if (openModalButton) {
        const modal = document.getElementById('modal');
        const closeModalSpan = document.querySelector('.close');
        const saveEventButton = document.getElementById('save-event');

        // Ouvrir la modale pour créer ou modifier une activité
        openModalButton.addEventListener('click', function () {
            modal.style.display = 'block';
            resetModalFields(); // Réinitialise les champs pour éviter les conflits
        });

        // Fermer la modale de création/modification d'activité
        closeModalSpan.addEventListener('click', function () {
            modal.style.display = 'none';
            resetModalFields();
        });

        // Fermer la modale si l'utilisateur clique en dehors
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                resetModalFields();
            }
        });

        // Réinitialiser les champs de la modale
        function resetModalFields() {
            document.getElementById('activity-name').value = '';
            document.getElementById('activity-time-start').value = '';
            document.getElementById('activity-time-end').value = '';
            document.getElementById('activity-start-date').value = '';
            document.getElementById('activity-end-date').value = '';
            document.getElementById('activity-color').value = 'red';
            document.getElementById('activity-realized-time').value = '';
            document.getElementById('save-event').removeAttribute('data-activity-id');
        }

        // Ouvrir une activité existante pour modification
        function openActivityForEdit(activityId, date) {
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            const activity = activities.find(a => a.id === activityId);
            const modal = document.getElementById('modal');

            if (activity) {
                const detail = activity.activitiesDetails.find(d => d.date === date);

                if (detail) {
                    document.getElementById('activity-name').value = activity.activityName;
                    document.getElementById('activity-color').value = detail.color;
                    document.getElementById('activity-time-start').value = detail.startTime;
                    document.getElementById('activity-time-end').value = detail.endTime;
                    document.getElementById('activity-start-date').value = detail.date;
                    document.getElementById('activity-end-date').value = detail.date;
                    // Afficher les heures réalisées existantes si elles existent
                    document.getElementById('activity-realized-time').value = detail.realizedTime || '';

                    document.getElementById('save-event').setAttribute('data-activity-id', activityId);
                    document.getElementById('save-event').setAttribute('data-activity-date', date);
                    modal.style.display = 'block';
                }
            }
        }

        // Ajouter un bouton de suppression pour les activités dans le calendrier
        function addDeleteButton(activityElement, activityId, activityDate) {
            const deleteButton = document.createElement('span');
            deleteButton.textContent = '✖';
            deleteButton.classList.add('delete-activity-btn');
            deleteButton.style.color = 'white';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.marginLeft = '10px';

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
            const startTime = document.getElementById('activity-time-start').value;
            const endTime = document.getElementById('activity-time-end').value;
            const startDateValue = document.getElementById('activity-start-date').value;
            const endDateValue = document.getElementById('activity-end-date').value;
            const color = document.getElementById('activity-color').value;
            const realizedTime = parseFloat(document.getElementById('activity-realized-time').value) || 0;

            // Vérification des champs requis
            if (!activityName || !startTime || !endTime || !startDateValue) {
                alert('Veuillez remplir tous les champs requis.');
                return;
            }

            const startDate = new Date(startDateValue);

            if (activityId) {
                updateActivityDetail(activityId, startDateValue, startTime, endTime, realizedTime, color);
            } else {
                saveNewActivity(activityName, startDate, endDateValue, startTime, endTime, color, realizedTime);
            }

            loadActivitiesFromStorage(currentViewDate);
            updateActivitiesTable(); // Mettre à jour le tableau des activités
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

                    // Calculer les anciennes heures prévues
                    const oldStartTime = new Date(`1970-01-01T${oldDetail.startTime}`);
                    const oldEndTime = new Date(`1970-01-01T${oldDetail.endTime}`);
                    const oldPlannedHours = (oldEndTime - oldStartTime) / (1000 * 3600);

                    // Calculer les nouvelles heures prévues
                    const newStartTime = new Date(`1970-01-01T${startTime}`);
                    const newEndTime = new Date(`1970-01-01T${endTime}`);
                    const newPlannedHours = (newEndTime - newStartTime) / (1000 * 3600);

                    // Mettre à jour le total des heures prévues
                    activity.totalHours = (parseFloat(activity.totalHours) - oldPlannedHours + newPlannedHours).toFixed(2);

                    // Gérer les heures réalisées
                    const oldRealizedTime = parseFloat(oldDetail.realizedTime || 0);

                    // Si un nouveau temps réalisé est fourni
                    if (realizedTime !== '' && realizedTime !== undefined) {
                        const newRealizedTime = parseFloat(realizedTime);
                        // Mettre à jour le total des heures réalisées
                        activity.realizedHours = (parseFloat(activity.realizedHours || 0) - oldRealizedTime + newRealizedTime).toFixed(2);
                        // Mettre à jour les détails avec le nouveau temps réalisé
                        activity.activitiesDetails[detailIndex] = {
                            date: date,
                            startTime,
                            endTime,
                            color,
                            realizedTime: newRealizedTime
                        };
                    } else {
                        // Conserver les heures réalisées existantes
                        activity.activitiesDetails[detailIndex] = {
                            date: date,
                            startTime,
                            endTime,
                            color,
                            realizedTime: oldDetail.realizedTime || 0
                        };
                    }

                    activities[activityIndex] = activity;
                    localStorage.setItem('activities', JSON.stringify(activities));

                    // Réinitialiser le champ des heures réalisées
                    document.getElementById('activity-realized-time').value = '';

                    // Mettre à jour l'affichage
                    loadActivitiesFromStorage(currentViewDate);
                    updateActivitiesTable();
                }
            }
        }

        // Sauvegarder une nouvelle activité
        function saveNewActivity(activityName, startDate, endDateValue, startTime, endTime, color, realizedTime) {
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            const endDate = new Date(endDateValue);
            const dayDifference = Math.round((endDate - startDate) / (1000 * 3600 * 24));

            // Calculer les heures prévues pour cette nouvelle entrée
            const plannedHoursForThisEntry = parseFloat(((dayDifference + 1) * ((new Date(`1970-01-01T${endTime}`) - new Date(`1970-01-01T${startTime}`)) / (1000 * 3600))).toFixed(2));

            // Chercher si une activité avec le même nom existe déjà
            const existingActivityIndex = activities.findIndex(a => a.activityName === activityName);

            if (existingActivityIndex !== -1) {
                // Si l'activité existe, ajouter les nouveaux détails
                const existingActivity = activities[existingActivityIndex];

                // Ajouter les nouveaux détails d'activité
                for (let i = 0; i <= dayDifference; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + i);

                    existingActivity.activitiesDetails.push({
                        date: currentDate.toISOString().split('T')[0],
                        startTime,
                        endTime,
                        color,
                        realizedTime: 0
                    });
                }

                // Mettre à jour le total des heures prévues
                existingActivity.totalHours = (parseFloat(existingActivity.totalHours) + plannedHoursForThisEntry).toFixed(2);

                // Mettre à jour les heures réalisées si nécessaire
                if (realizedTime > 0) {
                    existingActivity.realizedHours = (parseFloat(existingActivity.realizedHours || 0) + realizedTime).toFixed(2);
                }

                activities[existingActivityIndex] = existingActivity;
            } else {
                // Si l'activité n'existe pas, créer une nouvelle entrée
                let activitiesDetails = [];

                for (let i = 0; i <= dayDifference; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + i);

                    activitiesDetails.push({
                        date: currentDate.toISOString().split('T')[0],
                        startTime,
                        endTime,
                        color,
                        realizedTime: 0
                    });
                }

                const newActivity = {
                    id: generateUniqueId(),
                    activityName,
                    totalHours: plannedHoursForThisEntry,
                    realizedHours: realizedTime || 0,
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

                        // Calculer les heures prévues pour cette activité
                        const startTime = new Date(`1970-01-01T${detail.startTime}`);
                        const endTime = new Date(`1970-01-01T${detail.endTime}`);
                        const plannedHours = ((endTime - startTime) / (1000 * 3600)).toFixed(2);

                        activityElement.innerHTML = `
                            <span class="activity-name">${activity.activityName}</span>
                            <span class="activity-time">${detail.startTime} - ${detail.endTime}</span>
                            <span class="activity-hours">(${plannedHours}h)</span>
                        `;

                        activityElement.addEventListener('click', function () {
                            openActivityForEdit(activity.id, detail.date);
                        });

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

            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            tableBody.innerHTML = '';

            activities.forEach(activity => {
                const row = tableBody.insertRow();
                const checkboxCell = row.insertCell(0);
                const nameCell = row.insertCell(1);
                const plannedHoursCell = row.insertCell(2);
                const realizedHoursCell = row.insertCell(3);
                const remainingHoursCell = row.insertCell(4);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('select-activity');
                checkbox.setAttribute('data-activity-id', activity.id);

                checkboxCell.appendChild(checkbox);
                nameCell.textContent = activity.activityName;
                plannedHoursCell.textContent = activity.totalHours.toFixed(2);
                realizedHoursCell.textContent = activity.realizedHours?.toFixed(2) || '0.00';
                remainingHoursCell.textContent = (activity.totalHours - (activity.realizedHours || 0)).toFixed(2);
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

            return activityDate >= startOfWeek && activityDate <= endOfWeek;
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
            const weekNumberContainer = document.getElementById('week-number');
            weekNumberContainer.textContent = `Semaine ${weekNumber}`;
        }

        displayWeekNumber(currentViewDate);
        loadActivitiesFromStorage(currentViewDate);
        updateActivitiesTable();

        function updateActivityNamesList() {
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            const datalist = document.getElementById('activity-names');
            const uniqueNames = [...new Set(activities.map(activity => activity.activityName))];

            // Créer un conteneur pour la liste des noms
            const namesContainer = document.createElement('div');
            namesContainer.id = 'names-container';
            namesContainer.style.position = 'absolute';
            namesContainer.style.width = '100%';
            namesContainer.style.maxHeight = '200px';
            namesContainer.style.overflowY = 'auto';
            namesContainer.style.backgroundColor = 'white';
            namesContainer.style.border = '1px solid #ccc';
            namesContainer.style.borderRadius = '4px';
            namesContainer.style.display = 'none';
            namesContainer.style.zIndex = '1000';

            uniqueNames.forEach(name => {
                const nameItem = document.createElement('div');
                nameItem.style.padding = '8px';
                nameItem.style.display = 'flex';
                nameItem.style.justifyContent = 'space-between';
                nameItem.style.alignItems = 'center';
                nameItem.style.cursor = 'pointer';
                nameItem.style.borderBottom = '1px solid #eee';

                const nameText = document.createElement('span');
                nameText.textContent = name;
                nameText.style.flex = '1';

                const deleteBtn = document.createElement('span');
                deleteBtn.textContent = '✖';
                deleteBtn.style.marginLeft = '10px';
                deleteBtn.style.color = 'red';
                deleteBtn.style.cursor = 'pointer';

                nameItem.appendChild(nameText);
                nameItem.appendChild(deleteBtn);

                // Sélectionner le nom
                nameText.addEventListener('click', () => {
                    document.getElementById('activity-name').value = name;
                    namesContainer.style.display = 'none';
                });

                // Supprimer le nom
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Voulez-vous supprimer "${name}" de la liste des suggestions ?`)) {
                        const activities = JSON.parse(localStorage.getItem('activities')) || [];
                        localStorage.setItem('activities', JSON.stringify(activities));
                        namesContainer.removeChild(nameItem);
                        if (namesContainer.children.length === 0) {
                            namesContainer.style.display = 'none';
                        }
                    }
                });

                // Effet hover
                nameItem.addEventListener('mouseenter', () => {
                    nameItem.style.backgroundColor = '#f0f0f0';
                });
                nameItem.addEventListener('mouseleave', () => {
                    nameItem.style.backgroundColor = 'white';
                });

                namesContainer.appendChild(nameItem);
            });

            // Remplacer l'ancien datalist
            const oldContainer = document.getElementById('names-container');
            if (oldContainer) {
                oldContainer.remove();
            }

            const inputContainer = document.getElementById('activity-name').parentElement;
            inputContainer.style.position = 'relative';
            inputContainer.appendChild(namesContainer);

            // Gérer l'affichage de la liste
            const activityNameInput = document.getElementById('activity-name');
            activityNameInput.addEventListener('focus', () => {
                if (namesContainer.children.length > 0) {
                    namesContainer.style.display = 'block';
                }
            });

            // Cacher la liste quand on clique en dehors
            document.addEventListener('click', (e) => {
                if (!namesContainer.contains(e.target) && e.target !== activityNameInput) {
                    namesContainer.style.display = 'none';
                }
            });

            // Filtrer la liste pendant la saisie
            activityNameInput.addEventListener('input', () => {
                const searchText = activityNameInput.value.toLowerCase();
                Array.from(namesContainer.children).forEach(item => {
                    const nameText = item.firstChild.textContent.toLowerCase();
                    item.style.display = nameText.includes(searchText) ? 'flex' : 'none';
                });
                namesContainer.style.display = 'block';
            });
        }

        document.addEventListener('DOMContentLoaded', function () {
            updateActivityNamesList();
        });
    }
});
