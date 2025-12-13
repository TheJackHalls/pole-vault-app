/*
 * Main application UI logic. Handles rendering of the four required screens
 * (Athletes List, Athlete Detail, New Jump, Jump Detail) and wire up
 * interactions with the Storage module. Each screen is re‑rendered on navigation
 * to keep the code simple and upgrade‑friendly.
 */

(function() {
    const app = document.getElementById('app');
    // exportBtn element may not exist because export is now accessed via Settings.
    const exportBtn = document.getElementById('exportBtn');
    // Settings storage key for Taykof defaults
    const SETTINGS_KEY = 'taykof_settings_v1';

    /**
     * Load settings from localStorage or return defaults. Settings control default
     * units and step type used when creating a new jump. These settings do not
     * modify existing stored data and are stored under a separate key from the
     * core data model.
     * @returns {{stepsType: string, gripUnit: string, takeoffUnit: string, barUnit: string, standardsUnit: string}}
     */
    function getSettings() {
        const defaultSettings = {
            stepsType: 'total',
            gripUnit: 'imperial',
            takeoffUnit: 'imperial',
            barUnit: 'imperial',
            standardsUnit: 'inches'
        };
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return defaultSettings;
        }
        try {
            const parsed = JSON.parse(raw);
            return Object.assign({}, defaultSettings, parsed);
        } catch (e) {
            console.error('Failed to parse settings', e);
            return defaultSettings;
        }
    }

    /**
     * Persist settings back to localStorage. Call this after user updates
     * defaults in the Settings modal.
     * @param {object} newSettings
     */
    function saveSettings(newSettings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }

    /**
     * Build and display the Settings modal. Allows the coach to configure
     * default units and step type. When the Save button is pressed the new
     * settings are persisted and the modal is closed.
     */
    function renderSettingsModal() {
        const current = getSettings();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h2>Settings</h2>
            <label>Default Steps Type
                <select id="setStepsType">
                    <option value="lefts" ${current.stepsType === 'lefts' ? 'selected' : ''}>Lefts</option>
                    <option value="rights" ${current.stepsType === 'rights' ? 'selected' : ''}>Rights</option>
                    <option value="total" ${current.stepsType === 'total' ? 'selected' : ''}>Total</option>
                </select>
            </label>
            <label>Default Grip Units
                <select id="setGripUnit">
                    <option value="imperial" ${current.gripUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                    <option value="metric" ${current.gripUnit === 'metric' ? 'selected' : ''}>Metric (m)</option>
                </select>
            </label>
            <label>Default Takeoff Units
                <select id="setTakeoffUnit">
                    <option value="imperial" ${current.takeoffUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                    <option value="metric" ${current.takeoffUnit === 'metric' ? 'selected' : ''}>Metric (m)</option>
                </select>
            </label>
            <label>Default Bar Height Units
                <select id="setBarUnit">
                    <option value="imperial" ${current.barUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                    <option value="metric" ${current.barUnit === 'metric' ? 'selected' : ''}>Metric (m)</option>
                </select>
            </label>
            <label>Default Standards Units
                <select id="setStandardsUnit">
                    <option value="inches" ${current.standardsUnit === 'inches' ? 'selected' : ''}>Inches</option>
                    <option value="cm" ${current.standardsUnit === 'cm' ? 'selected' : ''}>Centimeters</option>
                </select>
            </label>
            <div class="button-group">
                <button class="save-settings-btn" type="button">Save</button>
                <button class="cancel-settings-btn" type="button">Cancel</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        // Event handlers
        modal.querySelector('.save-settings-btn').addEventListener('click', () => {
            const updated = {
                stepsType: modal.querySelector('#setStepsType').value,
                gripUnit: modal.querySelector('#setGripUnit').value,
                takeoffUnit: modal.querySelector('#setTakeoffUnit').value,
                barUnit: modal.querySelector('#setBarUnit').value,
                standardsUnit: modal.querySelector('#setStandardsUnit').value
            };
            saveSettings(updated);
            document.body.removeChild(overlay);
        });
        modal.querySelector('.cancel-settings-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    /**
     * Create a gear button that opens the settings modal. This button is
     * positioned in the top‑right corner and remains visible on all screens.
     */
    function createSettingsButton() {
        if (document.getElementById('settingsBtn')) return;
        const btn = document.createElement('button');
        btn.id = 'settingsBtn';
        btn.className = 'settings-btn';
        // Unicode gear symbol
        btn.innerHTML = '&#9881;';
        btn.addEventListener('click', renderSettingsModal);
        document.body.appendChild(btn);
    }

    /**
     * Export the entire dataset as JSON, CSV or Excel. A modal is shown to
     * choose the format. JSON export reuses Storage.exportData(). CSV and XLSX
     * are generated client‑side.
     */
    function renderExportModal() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h2>Export Data</h2>
            <p>Select a format to download your data.</p>
            <div class="button-group">
                <button id="export-json" type="button">JSON</button>
                <button id="export-csv" type="button">CSV</button>
                <button id="export-xlsx" type="button">Excel</button>
            </div>
            <div class="button-group" style="justify-content:center;">
                <button id="export-cancel" type="button" class="cancel-settings-btn">Cancel</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        modal.querySelector('#export-json').addEventListener('click', () => {
            exportToJson();
            document.body.removeChild(overlay);
        });
        modal.querySelector('#export-csv').addEventListener('click', () => {
            exportToCsv();
            document.body.removeChild(overlay);
        });
        modal.querySelector('#export-xlsx').addEventListener('click', () => {
            exportToXlsx();
            document.body.removeChild(overlay);
        });
        modal.querySelector('#export-cancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    /**
     * Create a downloadable file from a Blob and trigger the download.
     * @param {Blob} blob
     * @param {string} filename
     */
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Export data as JSON. Uses Storage.exportData() to generate a blob.
     */
    function exportToJson() {
        const url = Storage.exportData();
        const a = document.createElement('a');
        a.href = url;
        a.download = 'taykof-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Export data as CSV. Generates a simple CSV containing athletes and jumps
     * sections separated by a blank line. Each section begins with a header row.
     */
    function exportToCsv() {
        const data = Storage.loadData();
        const lines = [];
        // Athletes
        lines.push('athlete_id,name,gender,weight_lbs');
        data.athletes.forEach(a => {
            lines.push(`${a.id},"${a.name.replace(/"/g, '""')}",${a.gender},${a.weightLbs}`);
        });
        lines.push(''); // empty line between sections
        // Jumps
        lines.push('jump_id,athlete_id,created_at,steps_count,steps_type,pole_brand,pole_weight,pole_length,grip_inches,grip_unit,takeoff_inches,takeoff_unit,bar_height_inches,bar_height_unit,standards_inches,standards_unit,result,notes');
        data.jumps.forEach(j => {
            const notesEscaped = (j.notes || '').replace(/"/g, '""');
            lines.push(`${j.id},${j.athleteId},${j.createdAt},${j.stepsCount ?? ''},${j.stepsType ?? ''},${j.poleBrand ?? ''},${j.poleWeight ?? ''},${j.poleLength ?? ''},${j.gripInches ?? ''},${j.gripUnit ?? ''},${j.takeoffInches ?? ''},${j.takeoffUnit ?? ''},${j.barHeightInches ?? ''},${j.barHeightUnit ?? ''},${j.standardsInches ?? ''},${j.standardsUnit ?? ''},${j.result ?? ''},"${notesEscaped}"`);
        });
        const csvStr = lines.join('\n');
        const blob = new Blob([csvStr], { type: 'text/csv' });
        triggerDownload(blob, 'taykof-data.csv');
    }

    /**
     * Export data as Excel (XLSX) using SheetJS. Creates two sheets:
     * Athletes and Jumps. Requires xlsx.full.min.js loaded in the HTML.
     */
    function exportToXlsx() {
        const data = Storage.loadData();
        // Build workbook
        const wb = XLSX.utils.book_new();
        // Athletes sheet
        const athleteRows = data.athletes.map(a => ({
            athlete_id: a.id,
            name: a.name,
            gender: a.gender,
            weight_lbs: a.weightLbs
        }));
        const wsAthletes = XLSX.utils.json_to_sheet(athleteRows);
        XLSX.utils.book_append_sheet(wb, wsAthletes, 'Athletes');
        // Jumps sheet
        const jumpRows = data.jumps.map(j => ({
            jump_id: j.id,
            athlete_id: j.athleteId,
            created_at: j.createdAt,
            steps_count: j.stepsCount ?? '',
            steps_type: j.stepsType ?? '',
            pole_brand: j.poleBrand ?? '',
            pole_weight: j.poleWeight ?? '',
            pole_length: j.poleLength ?? '',
            grip_inches: j.gripInches ?? '',
            grip_unit: j.gripUnit ?? '',
            takeoff_inches: j.takeoffInches ?? '',
            takeoff_unit: j.takeoffUnit ?? '',
            bar_height_inches: j.barHeightInches ?? '',
            bar_height_unit: j.barHeightUnit ?? '',
            standards_inches: j.standardsInches ?? '',
            standards_unit: j.standardsUnit ?? '',
            result: j.result ?? '',
            notes: j.notes ?? ''
        }));
        const wsJumps = XLSX.utils.json_to_sheet(jumpRows);
        XLSX.utils.book_append_sheet(wb, wsJumps, 'Jumps');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        // Convert string to ArrayBuffer
        const buf = new ArrayBuffer(wbout.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < wbout.length; ++i) view[i] = wbout.charCodeAt(i) & 0xFF;
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        triggerDownload(blob, 'taykof-data.xlsx');
    }

    /**
     * Utility to format dates in a readable way. Returns e.g. "Apr 12, 2025 3:45 PM".
     * @param {string|Date} dateStr
     */
    function formatDate(dateStr) {
        const date = (dateStr instanceof Date) ? dateStr : new Date(dateStr);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };
        return new Intl.DateTimeFormat(undefined, options).format(date);
    }

    /**
     * Navigate to a given view. Accepts a function that renders the view.
     * The previous content is replaced entirely.
     * @param {Function} renderFn
     */
    function navigate(renderFn) {
        app.innerHTML = '';
        const screen = document.createElement('div');
        screen.className = 'screen active';
        renderFn(screen);
        app.appendChild(screen);
    }

    /**
     * Render the Athletes List screen. Shows all athletes and provides a
     * collapsible form to add a new athlete.
     * @param {HTMLElement} container
     */
    function renderAthletesList(container) {
        const header = document.createElement('h1');
        header.textContent = 'Athletes';
        container.appendChild(header);


        const list = document.createElement('ul');
        list.className = 'list';
        const athletes = Storage.getAthletes();
        if (athletes.length > 0) {
            // hint for user
            const hint = document.createElement('p');
            hint.style.fontSize = '14px';
            hint.style.marginBottom = '8px';
            hint.style.color = '#666';
            hint.textContent = 'Tap an athlete to view details and log jumps.';
            container.appendChild(hint);
        }
        athletes.forEach(athlete => {
            const li = document.createElement('li');
            li.className = 'list-item';
            // display name and arrow to indicate clickable
            li.innerHTML = `<span>${athlete.name}</span><span style="font-size:20px; color:#003366;">›</span>`;
            li.style.justifyContent = 'space-between';
            li.addEventListener('click', () => {
                renderAthleteDetailScreen(athlete.id);
            });
            list.appendChild(li);
        });
        container.appendChild(list);

        // Add Athlete button shows the form
        const addBtn = document.createElement('button');
        addBtn.className = 'button-primary';
        addBtn.textContent = 'Add Athlete';
        container.appendChild(addBtn);

        const form = document.createElement('form');
        form.style.display = 'none';
        form.innerHTML = `
            <label>Name<input id="athlete-name" type="text" required></label>
            <label>Gender<select id="athlete-gender">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select></label>
            <label>Weight (lbs)<input id="athlete-weight" type="number" min="0" required></label>
            <button type="submit" class="button-primary">Save Athlete</button>
        `;
        container.appendChild(form);

        addBtn.addEventListener('click', () => {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = form.querySelector('#athlete-name');
            const genderSelect = form.querySelector('#athlete-gender');
            const weightInput = form.querySelector('#athlete-weight');
            if (!nameInput.value.trim()) return;
            const newAthlete = Storage.addAthlete({
                name: nameInput.value,
                gender: genderSelect.value,
                weightLbs: weightInput.value
            });
            // reset form
            nameInput.value = '';
            weightInput.value = '';
            form.style.display = 'none';
            // Navigate directly to the new athlete's detail page to encourage jump entry
            renderAthleteDetailScreen(newAthlete.id);
        });
    }

    /**
     * Render details for a single athlete, including summary and list of jumps.
     * @param {string} athleteId
     */
    function renderAthleteDetailScreen(athleteId) {
        navigate(container => {
            const athlete = Storage.getAthlete(athleteId);
            if (!athlete) {
                container.textContent = 'Athlete not found.';
                return;
            }
            // Back button
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Back';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                navigate(renderAthletesList);
            });
            container.appendChild(backBtn);

            const header = document.createElement('h2');
            header.textContent = athlete.name;
            container.appendChild(header);
            const info = document.createElement('p');
            info.textContent = `${athlete.gender}, ${athlete.weightLbs} lbs`;
            container.appendChild(info);

            // New Jump button
            const newJumpBtn = document.createElement('button');
            newJumpBtn.className = 'button-primary';
            newJumpBtn.textContent = 'New Jump';
            newJumpBtn.addEventListener('click', () => {
                renderNewJumpScreen(athlete);
            });
            container.appendChild(newJumpBtn);

            // Jumps list
            const jumps = Storage.getJumpsForAthlete(athleteId);
            if (jumps.length === 0) {
                const noJumps = document.createElement('p');
                noJumps.textContent = 'No jumps logged yet.';
                container.appendChild(noJumps);
            } else {
                const list = document.createElement('ul');
                list.className = 'list';
                jumps.forEach(jump => {
                    const li = document.createElement('li');
                    li.className = 'list-item';
                    // format bar height display based on unit
                    let barDisplay = '';
                    if (jump.barHeightInches != null) {
                        if (jump.barHeightUnit === 'metric') {
                            const m = (jump.barHeightInches / 39.3701).toFixed(2);
                            barDisplay = `${m}m`;
                        } else {
                            const total = parseFloat(jump.barHeightInches);
                            const ft = Math.floor(total / 12);
                            const inch = (total - ft * 12).toFixed(1);
                            barDisplay = `${ft}'${inch}"`;
                        }
                    }
                    const resultLabel = jump.result ? jump.result.charAt(0).toUpperCase() + jump.result.slice(1) : '';
                    li.innerHTML = `<strong>${barDisplay}</strong> - ${resultLabel}<span>${formatDate(jump.createdAt)}</span>`;
                    li.addEventListener('click', () => {
                        renderJumpDetailScreen(jump.id);
                    });
                    list.appendChild(li);
                });
                container.appendChild(list);
            }
        });
    }

    /**
     * Render the New Jump screen for a specific athlete. Prefills values from
     * the athlete's most recent jump if available.
     * @param {object} athlete
     */
    function renderNewJumpScreen(athlete) {
        navigate(container => {
            // Back button
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Cancel';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                renderAthleteDetailScreen(athlete.id);
            });
            container.appendChild(backBtn);

            const header = document.createElement('h2');
            header.textContent = `New Jump – ${athlete.name}`;
            container.appendChild(header);

            // determine last jump to prefill
            const previousJumps = Storage.getJumpsForAthlete(athlete.id);
            const lastJump = previousJumps.length > 0 ? previousJumps[0] : null;
            // Load settings to determine default units when no last jump exists
            const settings = getSettings();
            // Prefill values for steps
            const stepsCountVal = lastJump?.stepsCount ?? lastJump?.steps ?? '';
            const stepsTypeVal = lastJump?.stepsType ?? settings.stepsType;
            // Prefill pole values
            const poleBrandVal = lastJump?.poleBrand ?? '';
            const poleWeightVal = lastJump?.poleWeight ?? '';
            const poleLengthVal = lastJump?.poleLength ?? '';
            // Get saved poles
            const savedPoles = Storage.getPoles();
            let poleOptionsHtml = '<option value="custom">-- New Pole --</option>';
            savedPoles.forEach(pole => {
                const key = `${pole.brand}|${pole.weight}|${pole.length}`;
                const label = `${pole.brand} – ${pole.weight} – ${pole.length}`;
                const selected = (pole.brand === poleBrandVal && pole.weight === poleWeightVal && pole.length === poleLengthVal) ? 'selected' : '';
                poleOptionsHtml += `<option value="${key}" ${selected}>${label}</option>`;
            });
            // Measurement helpers
            function inchesToFeetInches(totalInches) {
                const feet = Math.floor(totalInches / 12);
                const inches = (totalInches - feet * 12);
                return { feet, inches };
            }
            function inchesToMeters(inches) {
                return inches / 39.3701;
            }
            function metersToInches(meters) {
                return meters * 39.3701;
            }
            // Prefill grip values
            const gripUnitVal = lastJump?.gripUnit ?? settings.gripUnit;
            const gripInchesVal = lastJump?.gripInches ? parseFloat(lastJump.gripInches) : null;
            let gripFeetVal = '';
            let gripInchesRemVal = '';
            let gripMetersVal = '';
            if (gripInchesVal !== null) {
                if (gripUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(gripInchesVal);
                    gripFeetVal = conv.feet;
                    gripInchesRemVal = parseFloat(conv.inches.toFixed(1));
                    gripMetersVal = (gripInchesVal / 39.3701).toFixed(2);
                } else {
                    gripMetersVal = (gripInchesVal / 39.3701).toFixed(2);
                    const conv = inchesToFeetInches(gripInchesVal);
                    gripFeetVal = conv.feet;
                    gripInchesRemVal = parseFloat(conv.inches.toFixed(1));
                }
            }
            // Prefill takeoff values
            const takeoffUnitVal = lastJump?.takeoffUnit ?? settings.takeoffUnit;
            const takeoffInchesVal = lastJump?.takeoffInches ? parseFloat(lastJump.takeoffInches) : null;
            let takeoffFeetVal = '';
            let takeoffInchesRemVal = '';
            let takeoffMetersVal = '';
            if (takeoffInchesVal !== null) {
                if (takeoffUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(takeoffInchesVal);
                    takeoffFeetVal = conv.feet;
                    takeoffInchesRemVal = parseFloat(conv.inches.toFixed(1));
                    takeoffMetersVal = (takeoffInchesVal / 39.3701).toFixed(2);
                } else {
                    takeoffMetersVal = (takeoffInchesVal / 39.3701).toFixed(2);
                    const conv = inchesToFeetInches(takeoffInchesVal);
                    takeoffFeetVal = conv.feet;
                    takeoffInchesRemVal = parseFloat(conv.inches.toFixed(1));
                }
            }
            // Prefill bar height values
            const barUnitVal = lastJump?.barHeightUnit ?? settings.barUnit;
            const barInchesVal = lastJump?.barHeightInches ? parseFloat(lastJump.barHeightInches) : null;
            let barFeetVal = '';
            let barInchesRemVal = '';
            let barMetersVal = '';
            if (barInchesVal !== null) {
                if (barUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(barInchesVal);
                    barFeetVal = conv.feet;
                    barInchesRemVal = parseFloat(conv.inches.toFixed(1));
                    barMetersVal = (barInchesVal / 39.3701).toFixed(2);
                } else {
                    barMetersVal = (barInchesVal / 39.3701).toFixed(2);
                    const conv = inchesToFeetInches(barInchesVal);
                    barFeetVal = conv.feet;
                    barInchesRemVal = parseFloat(conv.inches.toFixed(1));
                }
            }
            // Prefill standards
            const standardsUnitVal = lastJump?.standardsUnit ?? settings.standardsUnit;
            const standardsInchesVal = lastJump?.standardsInches ? parseFloat(lastJump.standardsInches) : null;
            let standardsDisplayVal = '';
            if (standardsInchesVal !== null) {
                if (standardsUnitVal === 'cm') {
                    standardsDisplayVal = (standardsInchesVal / 0.393701).toFixed(1);
                } else {
                    standardsDisplayVal = parseFloat(standardsInchesVal.toFixed(1));
                }
            }
            const notesVal = lastJump?.notes ?? '';

            const form = document.createElement('form');
            // Build form HTML with prefilled values. Units are derived from last jump or global settings.
            form.innerHTML = `
                <div class="field-group">
                    <label>Steps Count
                        <input type="number" id="stepsCount" value="${stepsCountVal}" inputmode="numeric" pattern="[0-9]*" min="0">
                    </label>
                    <label>Steps Type
                        <select id="stepsType">
                            <option value="lefts" ${stepsTypeVal === 'lefts' ? 'selected' : ''}>Lefts</option>
                            <option value="rights" ${stepsTypeVal === 'rights' ? 'selected' : ''}>Rights</option>
                            <option value="total" ${stepsTypeVal === 'total' ? 'selected' : ''}>Total</option>
                        </select>
                    </label>
                </div>
                <div class="field-group">
                    <label>Saved Poles
                        <select id="poleSelect">
                            ${poleOptionsHtml}
                        </select>
                    </label>
                    <label>Brand
                        <input type="text" id="poleBrand" value="${poleBrandVal}">
                    </label>
                    <label>Weight
                        <input type="text" id="poleWeight" value="${poleWeightVal}">
                    </label>
                    <label>Length
                        <input type="text" id="poleLength" value="${poleLengthVal}">
                    </label>
                </div>
                <div class="field-group">
                    <label>Grip
                        <div class="field-row">
                            ${gripUnitVal === 'imperial' ? `
                                <input type="number" id="gripFeet" class="field-number" value="${gripFeetVal}" min="0" step="1">
                                <input type="number" id="gripInchesInput" class="field-number" value="${gripInchesRemVal}" min="0" step="0.1">
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="gripMeters" class="field-number" value="${gripMetersVal}" min="0" step="0.01">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </label>
                </div>
                <div class="field-group">
                    <label>Takeoff
                        <div class="field-row">
                            ${takeoffUnitVal === 'imperial' ? `
                                <input type="number" id="takeoffFeet" class="field-number" value="${takeoffFeetVal}" min="0" step="1">
                                <input type="number" id="takeoffInchesInput" class="field-number" value="${takeoffInchesRemVal}" min="0" step="0.1">
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="takeoffMeters" class="field-number" value="${takeoffMetersVal}" min="0" step="0.01">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </label>
                </div>
                <div class="field-group">
                    <label>Bar Height
                        <div class="field-row">
                            ${barUnitVal === 'imperial' ? `
                                <input type="number" id="barFeet" class="field-number" value="${barFeetVal}" min="0" step="1">
                                <input type="number" id="barInchesInput" class="field-number" value="${barInchesRemVal}" min="0" step="0.1">
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="barMeters" class="field-number" value="${barMetersVal}" min="0" step="0.01">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </label>
                </div>
                <div class="field-group">
                    <label>Standards
                        <div class="field-row">
                            <select id="standardsValue"></select>
                            <span class="unit-pill">${standardsUnitVal === 'cm' ? 'cm' : 'in'}</span>
                        </div>
                    </label>
                </div>
                <label>Notes (optional)
                    <textarea id="notes">${notesVal}</textarea>
                </label>
            `;
            container.appendChild(form);

            // no dynamic unit selects; units are controlled by settings or last jump.
            // handle pole selection
            const poleSelectEl = form.querySelector('#poleSelect');
            poleSelectEl.addEventListener('change', () => {
                const val = poleSelectEl.value;
                if (val === 'custom') {
                    // clear fields for new entry
                    form.querySelector('#poleBrand').value = '';
                    form.querySelector('#poleWeight').value = '';
                    form.querySelector('#poleLength').value = '';
                } else {
                    const parts = val.split('|');
                    form.querySelector('#poleBrand').value = parts[0] || '';
                    form.querySelector('#poleWeight').value = parts[1] || '';
                    form.querySelector('#poleLength').value = parts[2] || '';
                }
            });

            // Populate standards dropdown based on the selected unit (from last jump or settings).
            function populateStandardsOptions(selectedUnit) {
                const valueSelect = form.querySelector('#standardsValue');
                valueSelect.innerHTML = '';
                let options = [];
                if (selectedUnit === 'cm') {
                    // 45cm to 80cm inclusive, step 5cm
                    for (let cm = 45; cm <= 80; cm += 5) {
                        options.push({ label: `${cm} cm`, value: cm });
                    }
                } else {
                    // inches: 18 in to 31.5 in inclusive increments of 1 in, final 31.5
                    for (let inch = 18; inch <= 31; inch++) {
                        options.push({ label: `${inch} in`, value: inch });
                    }
                    options.push({ label: '31.5 in', value: 31.5 });
                }
                options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    valueSelect.appendChild(o);
                });
                // determine preselected value from last jump
                let preselect = null;
                if (standardsInchesVal != null) {
                    if (selectedUnit === 'cm') {
                        const cmVal = standardsInchesVal / 0.393701;
                        preselect = Math.round(cmVal / 5) * 5;
                        if (preselect < 45) preselect = 45;
                        if (preselect > 80) preselect = 80;
                    } else {
                        const inchVal = standardsInchesVal;
                        if (inchVal > 31) {
                            preselect = 31.5;
                        } else {
                            preselect = Math.round(inchVal);
                            if (preselect < 18) preselect = 18;
                            if (preselect > 31) preselect = 31;
                        }
                    }
                }
                if (preselect != null) {
                    const matchOption = Array.from(valueSelect.options).find(o => parseFloat(o.value) === parseFloat(preselect));
                    if (matchOption) {
                        matchOption.selected = true;
                    }
                }
            }
            // initial population of standards options
            populateStandardsOptions(standardsUnitVal);

            // result selection
            let selectedResult = 'make'; // default
            const resultContainer = document.createElement('div');
            resultContainer.className = 'result-buttons';
            const makeBtn = document.createElement('button');
            makeBtn.className = 'make-btn';
            makeBtn.type = 'button';
            makeBtn.textContent = 'Make';
            const missBtn = document.createElement('button');
            missBtn.className = 'miss-btn';
            missBtn.type = 'button';
            missBtn.textContent = 'Miss';
            // highlight selected
            function updateResultButtons() {
                makeBtn.classList.toggle('selected', selectedResult === 'make');
                missBtn.classList.toggle('selected', selectedResult === 'miss');
            }
            makeBtn.addEventListener('click', () => {
                selectedResult = 'make';
                updateResultButtons();
            });
            missBtn.addEventListener('click', () => {
                selectedResult = 'miss';
                updateResultButtons();
            });
            updateResultButtons();
            resultContainer.appendChild(makeBtn);
            resultContainer.appendChild(missBtn);
            container.appendChild(resultContainer);

            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'button-primary';
            saveBtn.textContent = 'Save Jump';
            saveBtn.type = 'button';
            saveBtn.addEventListener('click', () => {
                // collect values
                const stepsCount = form.querySelector('#stepsCount').value;
                const stepsType = form.querySelector('#stepsType').value;
                const poleBrand = form.querySelector('#poleBrand').value.trim();
                const poleWeight = form.querySelector('#poleWeight').value.trim();
                const poleLength = form.querySelector('#poleLength').value.trim();
                // save pole combination
                if (poleBrand || poleWeight || poleLength) {
                    Storage.addPole({ brand: poleBrand, weight: poleWeight, length: poleLength });
                }
                // grip
                const gripUnit = gripUnitVal;
                let gripInchesCalc = null;
                if (gripUnit === 'imperial') {
                    const feetVal = parseFloat(form.querySelector('#gripFeet').value) || 0;
                    const inchVal = parseFloat(form.querySelector('#gripInchesInput').value) || 0;
                    gripInchesCalc = feetVal * 12 + inchVal;
                } else {
                    const mVal = parseFloat(form.querySelector('#gripMeters').value) || 0;
                    gripInchesCalc = mVal * 39.3701;
                }
                // takeoff
                const takeoffUnit = takeoffUnitVal;
                let takeoffInchesCalc = null;
                if (takeoffUnit === 'imperial') {
                    const feetVal = parseFloat(form.querySelector('#takeoffFeet').value) || 0;
                    const inchVal = parseFloat(form.querySelector('#takeoffInchesInput').value) || 0;
                    takeoffInchesCalc = feetVal * 12 + inchVal;
                } else {
                    const mVal = parseFloat(form.querySelector('#takeoffMeters').value) || 0;
                    takeoffInchesCalc = mVal * 39.3701;
                }
                // bar height
                const barUnit = barUnitVal;
                let barInchesCalc = null;
                if (barUnit === 'imperial') {
                    const feetVal = parseFloat(form.querySelector('#barFeet').value) || 0;
                    const inchVal = parseFloat(form.querySelector('#barInchesInput').value) || 0;
                    barInchesCalc = feetVal * 12 + inchVal;
                } else {
                    const mVal = parseFloat(form.querySelector('#barMeters').value) || 0;
                    barInchesCalc = mVal * 39.3701;
                }
                // standards
                const standardsUnit = standardsUnitVal;
                // standardsValue is a select; parse its value as float
                const standardsVal = parseFloat(form.querySelector('#standardsValue').value);
                let standardsInchesCalc = 0;
                if (standardsUnit === 'cm') {
                    standardsInchesCalc = standardsVal * 0.393701;
                } else {
                    standardsInchesCalc = standardsVal;
                }
                const notes = form.querySelector('#notes').value || '';
                const jumpData = {
                    stepsCount: stepsCount === '' ? null : parseInt(stepsCount, 10),
                    stepsType,
                    poleBrand,
                    poleWeight,
                    poleLength,
                    gripInches: gripInchesCalc !== null ? parseFloat(gripInchesCalc.toFixed(2)) : null,
                    gripUnit,
                    takeoffInches: takeoffInchesCalc !== null ? parseFloat(takeoffInchesCalc.toFixed(2)) : null,
                    takeoffUnit,
                    barHeightInches: barInchesCalc !== null ? parseFloat(barInchesCalc.toFixed(2)) : null,
                    barHeightUnit: barUnit,
                    standardsInches: parseFloat(standardsInchesCalc.toFixed(2)),
                    standardsUnit,
                    result: selectedResult,
                    notes
                };
                Storage.addJump(athlete.id, jumpData);
                renderAthleteDetailScreen(athlete.id);
            });
            container.appendChild(saveBtn);
        });
    }

    /**
     * Render the Jump Detail screen. Read-only display of all jump fields.
     * @param {string} jumpId
     */
    function renderJumpDetailScreen(jumpId) {
        navigate(container => {
            const jump = Storage.getJumpById(jumpId);
            if (!jump) {
                container.textContent = 'Jump not found.';
                return;
            }
            const athlete = Storage.getAthlete(jump.athleteId);
            // Back button
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Back';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                renderAthleteDetailScreen(jump.athleteId);
            });
            container.appendChild(backBtn);
            const header = document.createElement('h2');
            header.textContent = `${athlete?.name || ''} – Jump Detail`;
            container.appendChild(header);

            const detailList = document.createElement('ul');
            detailList.className = 'list';
            function addItem(label, value) {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.style.display = 'flex';
                li.style.flexDirection = 'column';
                const spanLabel = document.createElement('span');
                spanLabel.style.fontWeight = 'bold';
                spanLabel.textContent = label;
                const spanValue = document.createElement('span');
                spanValue.textContent = value ?? '';
                li.appendChild(spanLabel);
                li.appendChild(spanValue);
                detailList.appendChild(li);
            }
            // Steps: show count and type if available
            if (jump.stepsCount != null || jump.stepsType) {
                const count = jump.stepsCount != null ? jump.stepsCount : jump.steps;
                const type = jump.stepsType || '';
                addItem('Steps', `${count ?? ''} ${type}`.trim());
            } else {
                addItem('Steps', jump.steps ?? '');
            }
            // Pole information
            if (jump.poleBrand || jump.poleWeight || jump.poleLength) {
                const brand = jump.poleBrand || '';
                const weight = jump.poleWeight || '';
                const length = jump.poleLength || '';
                addItem('Pole', `${brand} ${weight} ${length}`.trim());
            } else {
                addItem('Pole', jump.poleLabel ?? '');
            }
            // Grip display
            if (jump.gripInches != null) {
                let gripDisplay;
                if (jump.gripUnit === 'metric') {
                    const meters = (jump.gripInches / 39.3701).toFixed(2);
                    gripDisplay = `${meters} m`;
                } else {
                    const total = parseFloat(jump.gripInches);
                    const ft = Math.floor(total / 12);
                    const inch = (total - ft * 12).toFixed(1);
                    gripDisplay = `${ft}' ${inch}"`;
                }
                addItem('Grip', gripDisplay);
            } else {
                addItem('Grip', '');
            }
            // Takeoff display
            if (jump.takeoffInches != null) {
                let takeoffDisplay;
                if (jump.takeoffUnit === 'metric') {
                    const m = (jump.takeoffInches / 39.3701).toFixed(2);
                    takeoffDisplay = `${m} m`;
                } else {
                    const total = parseFloat(jump.takeoffInches);
                    const ft = Math.floor(total / 12);
                    const inch = (total - ft * 12).toFixed(1);
                    takeoffDisplay = `${ft}' ${inch}"`;
                }
                addItem('Takeoff', takeoffDisplay);
            } else {
                addItem('Takeoff', '');
            }
            // Standards display
            if (jump.standardsInches != null) {
                let standardsDisplay;
                if (jump.standardsUnit === 'cm') {
                    const cm = (jump.standardsInches / 0.393701).toFixed(1);
                    standardsDisplay = `${cm} cm`;
                } else {
                    standardsDisplay = `${parseFloat(jump.standardsInches).toFixed(1)}"`;
                }
                addItem('Standards', standardsDisplay);
            } else {
                addItem('Standards', '');
            }
            // Bar height display
            if (jump.barHeightInches != null) {
                let barDisplay;
                if (jump.barHeightUnit === 'metric') {
                    const m = (jump.barHeightInches / 39.3701).toFixed(2);
                    barDisplay = `${m} m`;
                } else {
                    const total = parseFloat(jump.barHeightInches);
                    const ft = Math.floor(total / 12);
                    const inch = (total - ft * 12).toFixed(1);
                    barDisplay = `${ft}' ${inch}"`;
                }
                addItem('Bar Height', barDisplay);
            } else {
                addItem('Bar Height', '');
            }
            addItem('Result', jump.result);
            addItem('Notes', jump.notes || '');
            addItem('Recorded', formatDate(jump.createdAt));

            container.appendChild(detailList);

            // Placeholder for video
            const placeholder = document.createElement('div');
            placeholder.style.marginTop = '12px';
            placeholder.style.padding = '20px';
            placeholder.style.backgroundColor = '#eee';
            placeholder.style.borderRadius = '8px';
            placeholder.style.textAlign = 'center';
            placeholder.textContent = 'Video placeholder (future feature)';
            container.appendChild(placeholder);
        });
    }

    // Export data button handler (legacy). If exportBtn exists (older versions), open export modal.
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            // Show export options modal instead of immediate JSON download
            renderExportModal();
        });
    }

    // Kick off the app by rendering the athletes list
    navigate(renderAthletesList);

    // Create the persistent settings gear button
    createSettingsButton();

    /**
     * Show a one‑time guidance banner for iOS users who are not using Safari.
     * Apple requires PWAs to be installed via Safari. On first launch, if the
     * user is on iOS and using Chrome, Edge, or Brave, we display a small
     * dismissible banner explaining how to install the app. The banner will
     * not block interaction and will only appear once per browser via
     * localStorage. Data remains local; no network requests are made.
     */
    function showIOSInstallBanner() {
        try {
            // Check if we've already dismissed the banner
            const dismissed = localStorage.getItem('iosInstallBannerDismissed');
            if (dismissed) return;

            const ua = window.navigator.userAgent || '';
            const isIOS = /iPad|iPhone|iPod/.test(ua);
            // Safari on iOS advertises itself as 'Safari' and does not include
            // other browser identifiers like CriOS (Chrome), FxiOS (Firefox), EdgiOS (Edge), or Brave.
            const isSafari = isIOS &&
                ua.includes('Safari') &&
                !ua.includes('CriOS') &&
                !ua.includes('FxiOS') &&
                !ua.includes('EdgiOS') &&
                !ua.includes('OPiOS') &&
                !ua.includes('Brave');
            // Only show the banner for iOS when not using Safari
            if (isIOS && !isSafari) {
                const banner = document.createElement('div');
                banner.id = 'ios-install-banner';
                banner.style.position = 'fixed';
                banner.style.bottom = '0';
                banner.style.left = '0';
                banner.style.right = '0';
                banner.style.backgroundColor = '#003366';
                banner.style.color = '#fff';
                banner.style.padding = '12px';
                banner.style.fontSize = '14px';
                banner.style.display = 'flex';
                banner.style.justifyContent = 'space-between';
                banner.style.alignItems = 'center';
                banner.style.zIndex = '1000';
                banner.style.boxShadow = '0 -2px 4px rgba(0,0,0,0.3)';
                banner.innerHTML = `
                    <span style="flex:1; margin-right:8px;">To install this app on your iPhone, open it once in Safari and tap “Add to Home Screen”.</span>
                    <button id="ios-install-dismiss" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;">✕</button>
                `;
                document.body.appendChild(banner);
                document.getElementById('ios-install-dismiss').addEventListener('click', () => {
                    banner.remove();
                    localStorage.setItem('iosInstallBannerDismissed', 'true');
                });
            }
        } catch (e) {
            // fail silently if any error occurs; do not block app
            console.error('Error showing iOS install banner', e);
        }
    }

    // Trigger the banner on load
    document.addEventListener('DOMContentLoaded', showIOSInstallBanner);
})();