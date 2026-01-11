/*
 * Main application UI logic. Handles rendering of the four required screens
 * (Athletes List, Athlete Detail, Log, Jump Detail) and wire up
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
     * @returns {{stepsMode: string, gripUnit: string, takeoffUnit: string, barUnit: string, standardsUnit: string, poleUnit: string}}
     */
    function getSettings() {
        const defaultSettings = {
            // Steps counting mode: lefts/rights or total steps
            stepsMode: 'leftsRights',
            // Default units for grip, takeoff and bar height measurements
            gripUnit: 'imperial',
            takeoffUnit: 'imperial',
            barUnit: 'imperial',
            standardsUnit: 'inches',
            // Default units for poles (imperial/metric)
            poleUnit: 'imperial',
            // Default unit for the approach mark (imperial/metric)
            approachUnit: 'imperial',
            // Whether the coach's intermediate mark should be used at all
            enableCoachMark: false,
            // Coach mark type: 'distance' or 'step'. Distance uses units similar to approach
            coachMarkType: 'distance',
            // Default unit for coach mark distance (imperial/metric)
            coachMarkUnit: 'imperial',
            // Optional logging fields
            enableSteps: true,
            enableApproachDistance: true,
            enableTakeoffDistance: true,
            enablePoleSelection: true,
            enableGripHeight: true,
            enableStandards: true,
            enableLanding: false,
            enablePoleBend: false,
            enableNotes: true,
            // Whether the takeoff step hit check is enabled
            enableTakeoffStepCheck: false
        };
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return defaultSettings;
        }
        try {
            const parsed = JSON.parse(raw);
            const merged = Object.assign({}, defaultSettings, parsed);
            if (!merged.stepsMode && parsed.stepsType) {
                merged.stepsMode = parsed.stepsType === 'total' ? 'steps' : 'leftsRights';
            }
            return merged;
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
            <div class="settings-section">
                <h3>Units</h3>
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
                <label>Default Pole Units
                    <select id="setPoleUnit">
                        <option value="imperial" ${current.poleUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                        <option value="metric" ${current.poleUnit === 'metric' ? 'selected' : ''}>Metric (m/cm)</option>
                    </select>
                </label>
                <label>Default Approach Units
                    <select id="setApproachUnit">
                        <option value="imperial" ${current.approachUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                        <option value="metric" ${current.approachUnit === 'metric' ? 'selected' : ''}>Metric (m)</option>
                    </select>
                </label>
            </div>
            <div class="settings-section">
                <h3>Logging Options</h3>
                <label>Steps Counting Mode
                    <select id="setStepsMode">
                        <option value="leftsRights" ${current.stepsMode === 'leftsRights' ? 'selected' : ''}>Lefts/Rights</option>
                        <option value="steps" ${current.stepsMode === 'steps' ? 'selected' : ''}>Steps</option>
                    </select>
                </label>
                <label>Show Steps
                    <input type="checkbox" id="setEnableSteps" ${current.enableSteps ? 'checked' : ''}>
                </label>
                <label>Show Approach Distance
                    <input type="checkbox" id="setEnableApproachDistance" ${current.enableApproachDistance ? 'checked' : ''}>
                </label>
                <label>Show Takeoff Distance
                    <input type="checkbox" id="setEnableTakeoffDistance" ${current.enableTakeoffDistance ? 'checked' : ''}>
                </label>
                <label>Show Pole Selection
                    <input type="checkbox" id="setEnablePoleSelection" ${current.enablePoleSelection ? 'checked' : ''}>
                </label>
                <label>Show Grip Height
                    <input type="checkbox" id="setEnableGripHeight" ${current.enableGripHeight ? 'checked' : ''}>
                </label>
                <label>Show Standards
                    <input type="checkbox" id="setEnableStandards" ${current.enableStandards ? 'checked' : ''}>
                </label>
                <label>Show Landing
                    <input type="checkbox" id="setEnableLanding" ${current.enableLanding ? 'checked' : ''}>
                </label>
                <label>Show Pole Bend
                    <input type="checkbox" id="setEnablePoleBend" ${current.enablePoleBend ? 'checked' : ''}>
                </label>
                <label>Show Notes
                    <input type="checkbox" id="setEnableNotes" ${current.enableNotes ? 'checked' : ''}>
                </label>
                <label>Use Coach's Mark
                    <input type="checkbox" id="setEnableCoachMark" ${current.enableCoachMark ? 'checked' : ''}>
                </label>
                <div id="coachMarkSettings" style="display:${current.enableCoachMark ? 'block' : 'none'};">
                    <label>Coach's Mark Type
                        <select id="setCoachMarkType">
                            <option value="distance" ${current.coachMarkType === 'distance' ? 'selected' : ''}>Distance</option>
                            <option value="step" ${current.coachMarkType === 'step' ? 'selected' : ''}>Step</option>
                        </select>
                    </label>
                    <label id="coachMarkUnitLabel" style="display:${current.coachMarkType === 'distance' ? 'block' : 'none'};">Coach's Mark Units
                        <select id="setCoachMarkUnit">
                            <option value="imperial" ${current.coachMarkUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
                            <option value="metric" ${current.coachMarkUnit === 'metric' ? 'selected' : ''}>Metric (m)</option>
                        </select>
                    </label>
                </div>
                <label>Takeoff Step Check
                    <input type="checkbox" id="setEnableTakeoffStepCheck" ${current.enableTakeoffStepCheck ? 'checked' : ''}>
                </label>
            </div>
            <h3>Data Management</h3>
            <div class="button-group" style="margin-bottom:8px;">
                <button id="settings-export-btn" type="button" class="button-primary">Export Data</button>
            </div>
            <div class="button-group">
                <button class="save-settings-btn" type="button">Save</button>
                <button class="cancel-settings-btn" type="button">Cancel</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        // Event handlers for dynamic coach mark fields
        const enableCoachMarkEl = modal.querySelector('#setEnableCoachMark');
        const coachMarkSettingsEl = modal.querySelector('#coachMarkSettings');
        const coachMarkTypeEl = modal.querySelector('#setCoachMarkType');
        const coachMarkUnitLabelEl = modal.querySelector('#coachMarkUnitLabel');
        enableCoachMarkEl.addEventListener('change', () => {
            coachMarkSettingsEl.style.display = enableCoachMarkEl.checked ? 'block' : 'none';
        });
        coachMarkTypeEl.addEventListener('change', () => {
            coachMarkUnitLabelEl.style.display = coachMarkTypeEl.value === 'distance' ? 'block' : 'none';
        });
        // Export from settings
        modal.querySelector('#settings-export-btn').addEventListener('click', () => {
            // Close settings modal first
            document.body.removeChild(overlay);
            // Open export modal
            renderExportModal();
        });
        // Save and cancel handlers
        modal.querySelector('.save-settings-btn').addEventListener('click', () => {
            const updated = {
                stepsMode: modal.querySelector('#setStepsMode').value,
                gripUnit: modal.querySelector('#setGripUnit').value,
                takeoffUnit: modal.querySelector('#setTakeoffUnit').value,
                barUnit: modal.querySelector('#setBarUnit').value,
                standardsUnit: modal.querySelector('#setStandardsUnit').value,
                poleUnit: modal.querySelector('#setPoleUnit').value,
                approachUnit: modal.querySelector('#setApproachUnit').value,
                enableSteps: modal.querySelector('#setEnableSteps').checked,
                enableApproachDistance: modal.querySelector('#setEnableApproachDistance').checked,
                enableTakeoffDistance: modal.querySelector('#setEnableTakeoffDistance').checked,
                enablePoleSelection: modal.querySelector('#setEnablePoleSelection').checked,
                enableGripHeight: modal.querySelector('#setEnableGripHeight').checked,
                enableStandards: modal.querySelector('#setEnableStandards').checked,
                enableLanding: modal.querySelector('#setEnableLanding').checked,
                enablePoleBend: modal.querySelector('#setEnablePoleBend').checked,
                enableNotes: modal.querySelector('#setEnableNotes').checked,
                enableCoachMark: modal.querySelector('#setEnableCoachMark').checked,
                coachMarkType: modal.querySelector('#setCoachMarkType').value,
                coachMarkUnit: modal.querySelector('#setCoachMarkUnit') ? modal.querySelector('#setCoachMarkUnit').value : 'imperial',
                enableTakeoffStepCheck: modal.querySelector('#setEnableTakeoffStepCheck').checked
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
        lines.push('jump_id,athlete_id,created_at,session_type,attempt,bar_up,steps_count,steps_type,pole_brand,pole_weight,pole_length,grip_inches,grip_unit,takeoff_inches,takeoff_unit,bar_height_inches,bar_height_unit,standards_inches,standards_unit,approach_inches,approach_unit,coach_mark_type,coach_mark_inches,coach_mark_unit,coach_mark_step,hit_coach_mark,hit_takeoff_step,result,landing,pole_bend,notes');
        data.jumps.forEach(j => {
            const notesEscaped = (j.notes || '').replace(/"/g, '""');
            lines.push(`${j.id},${j.athleteId},${j.createdAt},${j.sessionType ?? ''},${j.attempt ?? ''},${j.barUp ?? ''},${j.stepsCount ?? ''},${j.stepsType ?? ''},${j.poleBrand ?? ''},${j.poleWeight ?? ''},${j.poleLength ?? ''},${j.gripInches ?? ''},${j.gripUnit ?? ''},${j.takeoffInches ?? ''},${j.takeoffUnit ?? ''},${j.barHeightInches ?? ''},${j.barHeightUnit ?? ''},${j.standardsInches ?? ''},${j.standardsUnit ?? ''},${j.approachInches ?? ''},${j.approachUnit ?? ''},${j.coachMarkType ?? ''},${j.coachMarkInches ?? ''},${j.coachMarkUnit ?? ''},${j.coachMarkStep ?? ''},${j.hitCoachMark ?? ''},${j.hitTakeoffStep ?? ''},${j.result ?? ''},${j.landing ?? ''},${j.poleBend ?? ''},"${notesEscaped}"`);
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
            created_at: j.createdAt ?? j.date ?? '',
            session_type: j.sessionType ?? '',
            attempt: j.attempt ?? '',
            bar_up: j.barUp ?? '',
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
            approach_inches: j.approachInches ?? '',
            approach_unit: j.approachUnit ?? '',
            coach_mark_type: j.coachMarkType ?? '',
            coach_mark_inches: j.coachMarkInches ?? '',
            coach_mark_unit: j.coachMarkUnit ?? '',
            coach_mark_step: j.coachMarkStep ?? '',
            hit_coach_mark: j.hitCoachMark ?? '',
            hit_takeoff_step: j.hitTakeoffStep ?? '',
            result: j.result ?? '',
            landing: j.landing ?? '',
            pole_bend: j.poleBend ?? '',
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
     * Escape HTML-sensitive characters to avoid injection when using innerHTML.
     * @param {string|number|null|undefined} value
     * @returns {string}
     */
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case "'":
                    return '&#39;';
                default:
                    return char;
            }
        });
    }

    /**
     * Resolve the best available date for a jump, preferring createdAt and
     * falling back to any legacy date field. Returns null when no valid date
     * can be parsed.
     * @param {object} jump
     * @returns {Date|null}
     */
    function resolveJumpDate(jump) {
        if (!jump) return null;
        if (jump.createdAt) {
            const created = new Date(jump.createdAt);
            if (!isNaN(created)) return created;
        }
        if (jump.date) {
            const legacy = new Date(jump.date);
            if (!isNaN(legacy)) return legacy;
        }
        return null;
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

    function createScreenTitle(text) {
        const title = document.createElement('h1');
        title.className = 'screen-title';
        title.textContent = text;
        return title;
    }

    /**
     * Render the Poles screen, showing saved poles and an Add Pole action.
     */
    function renderPolesScreen() {
        navigate(container => {
            // Back button
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Back';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                navigate(renderAthletesList);
            });
            container.appendChild(backBtn);

            const header = createScreenTitle('Poles');
            container.appendChild(header);

            const addPoleBtn = document.createElement('button');
            addPoleBtn.className = 'button-primary';
            addPoleBtn.textContent = 'Add Pole';
            container.appendChild(addPoleBtn);

            const sectionTitle = document.createElement('h3');
            sectionTitle.className = 'section-title';
            sectionTitle.textContent = 'Pole Bag';
            container.appendChild(sectionTitle);

            const poles = Storage.getPoles();
            if (poles.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'No poles saved yet.';
                container.appendChild(empty);
            } else {
                const list = document.createElement('ul');
                list.className = 'list';
                poles.forEach(pole => {
                    const li = document.createElement('li');
                    li.className = 'list-item';
                    const weightLabel = pole.weight ? `${pole.weight} lb` : '';
                    const label = `${pole.brand || ''} ${weightLabel} ${pole.length || ''}`.replace(/\s+/g, ' ').trim();
                    const span = document.createElement('span');
                    span.textContent = label;
                    li.appendChild(span);
                    list.appendChild(li);
                });
                container.appendChild(list);
            }

            function renderAddPoleModal() {
                const settings = getSettings();
                const savedPoles = Storage.getPoles();
                const brands = Array.from(new Set(savedPoles.map(p => p.brand).filter(Boolean)));
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                const modal = document.createElement('div');
                modal.className = 'modal';
                const isMetric = settings.poleUnit === 'metric';
                const feetOptions = Array.from({ length: 13 }, (_, idx) => 6 + idx)
                    .map(val => `<option value="${val}">${val}</option>`)
                    .join('');
                const inchesOptions = Array.from({ length: 12 }, (_, idx) => 1 + idx)
                    .map(val => `<option value="${val}">${val}</option>`)
                    .join('');
                const meterOptions = Array.from({ length: 6 }, (_, idx) => 1 + idx)
                    .map(val => `<option value="${val}">${val}</option>`)
                    .join('');
                const centimeterOptions = Array.from({ length: 100 }, (_, idx) => idx)
                    .map(val => `<option value="${val}">${val}</option>`)
                    .join('');
                modal.innerHTML = `
                    <h2>Add Pole</h2>
                    <label>Brand
                        <input type="text" id="poleBrandInput" list="poleBrandList" placeholder="Select or type a brand">
                        <datalist id="poleBrandList">
                            ${brands.map(brand => `<option value="${escapeHtml(brand)}"></option>`).join('')}
                        </datalist>
                    </label>
                    <label>Length
                        <div class="field-row">
                            ${isMetric ? `
                                <select id="poleMeters">${meterOptions}</select>
                                <span class="unit-pill">m</span>
                                <select id="poleCentimeters">${centimeterOptions}</select>
                                <span class="unit-pill">cm</span>
                            ` : `
                                <select id="poleFeet">${feetOptions}</select>
                                <span class="unit-pill">ft</span>
                                <select id="poleInches">${inchesOptions}</select>
                                <span class="unit-pill">in</span>
                            `}
                        </div>
                    </label>
                    <label>Weight
                        <input type="text" id="poleWeightInput" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="lbs">
                    </label>
                    <div class="button-group">
                        <button class="save-settings-btn" type="button" id="savePoleBtn">Save</button>
                        <button class="cancel-settings-btn" type="button" id="cancelPoleBtn">Cancel</button>
                    </div>
                `;
                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                const weightInput = modal.querySelector('#poleWeightInput');
                weightInput.addEventListener('input', () => {
                    weightInput.value = weightInput.value.replace(/\D/g, '').slice(0, 3);
                });

                modal.querySelector('#cancelPoleBtn').addEventListener('click', () => {
                    document.body.removeChild(overlay);
                });
                modal.querySelector('#savePoleBtn').addEventListener('click', () => {
                    const brand = modal.querySelector('#poleBrandInput').value.trim();
                    let length = '';
                    if (isMetric) {
                        const meters = modal.querySelector('#poleMeters').value;
                        const centimeters = modal.querySelector('#poleCentimeters').value;
                        length = `${meters} m ${centimeters} cm`;
                    } else {
                        const feet = modal.querySelector('#poleFeet').value;
                        const inches = modal.querySelector('#poleInches').value;
                        length = `${feet}' ${inches}"`;
                    }
                    const weight = weightInput.value.trim();
                    if (!brand || !length || !weight) {
                        alert('Please enter a brand, length, and weight.');
                        return;
                    }
                    Storage.addPole({ brand, weight, length });
                    document.body.removeChild(overlay);
                    renderPolesScreen();
                });
            }

            addPoleBtn.addEventListener('click', renderAddPoleModal);
        });
    }

    /**
     * Render the Athletes List screen. Shows all athletes and provides a
     * collapsible form to add a new athlete.
     * @param {HTMLElement} container
     */
    function renderAthletesList(container) {
        const header = createScreenTitle('Athletes');
        container.appendChild(header);

        const topActions = document.createElement('div');
        topActions.className = 'button-row';
        const logBtn = document.createElement('button');
        logBtn.className = 'button-primary';
        logBtn.textContent = 'Log';
        logBtn.addEventListener('click', () => {
            renderLogScreen();
        });
        const polesBtn = document.createElement('button');
        polesBtn.className = 'button-primary';
        polesBtn.textContent = 'Pole Bag';
        polesBtn.addEventListener('click', () => {
            renderPolesScreen();
        });
        topActions.appendChild(logBtn);
        topActions.appendChild(polesBtn);
        container.appendChild(topActions);

        const list = document.createElement('ul');
        list.className = 'list';
        const athletes = Storage.getAthletes();
        athletes.forEach(athlete => {
            const li = document.createElement('li');
            li.className = 'list-item';
            // display name and arrow to indicate clickable
            const nameSpan = document.createElement('span');
            nameSpan.textContent = athlete.name;
            const arrowSpan = document.createElement('span');
            arrowSpan.textContent = '›';
            arrowSpan.style.fontSize = '20px';
            arrowSpan.style.color = '#003366';
            li.appendChild(nameSpan);
            li.appendChild(arrowSpan);
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

            const header = createScreenTitle(athlete.name);
            container.appendChild(header);
            const info = document.createElement('p');
            info.textContent = `${athlete.gender}, ${athlete.weightLbs} lbs`;
            container.appendChild(info);

            // Log Jump button
            const newJumpBtn = document.createElement('button');
            newJumpBtn.className = 'button-primary';
            newJumpBtn.textContent = 'Log Jump';
            newJumpBtn.addEventListener('click', () => {
                renderLogScreen(athlete.id);
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
                    const jumpDate = resolveJumpDate(jump);
                    const dateLabel = jumpDate ? formatDate(jumpDate) : '';
                    const barStrong = document.createElement('strong');
                    barStrong.textContent = barDisplay;
                    const resultText = document.createTextNode(` - ${resultLabel}`);
                    const dateSpan = document.createElement('span');
                    dateSpan.textContent = dateLabel;
                    li.appendChild(barStrong);
                    li.appendChild(resultText);
                    li.appendChild(dateSpan);
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
     * Render the Log screen for quick jump entry.
     * @param {string} selectedAthleteId
     */
    function renderLogScreen(selectedAthleteId) {
        navigate(container => {
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Back';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                navigate(renderAthletesList);
            });
            container.appendChild(backBtn);

            const header = createScreenTitle('Log');
            container.appendChild(header);

            const athletes = Storage.getAthletes();
            if (athletes.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'Add an athlete to start logging jumps.';
                container.appendChild(empty);
                const goAthletesBtn = document.createElement('button');
                goAthletesBtn.className = 'button-primary';
                goAthletesBtn.textContent = 'Go to Athletes';
                goAthletesBtn.addEventListener('click', () => {
                    navigate(renderAthletesList);
                });
                container.appendChild(goAthletesBtn);

                const placeholder = document.createElement('div');
                placeholder.className = 'field-group';
                placeholder.innerHTML = `
                    <label>Athlete
                        <select disabled>
                            <option>None</option>
                        </select>
                    </label>
                    <div class="field-group">
                        <label>Session Type</label>
                        <div class="option-buttons">
                            <button type="button" class="option-button" disabled>Practice</button>
                            <button type="button" class="option-button" disabled>Competition</button>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Bar Height</label>
                        <div class="field-row">
                            <input type="number" class="field-number" disabled>
                            <input type="number" class="field-number" disabled>
                            <span class="unit-pill">ft/in</span>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Result</label>
                        <div class="option-buttons">
                            <button type="button" class="option-button" disabled>Make</button>
                            <button type="button" class="option-button" disabled>Miss</button>
                        </div>
                    </div>
                `;
                container.appendChild(placeholder);
                return;
            }

            const activeAthleteId = selectedAthleteId || athletes[0].id;
            const activeAthlete = Storage.getAthlete(activeAthleteId);
            const settings = getSettings();

            const topActions = document.createElement('div');
            topActions.className = 'button-row';
            const reviewBtn = document.createElement('button');
            reviewBtn.className = 'button-secondary';
            reviewBtn.textContent = 'See Jump Log';
            reviewBtn.addEventListener('click', () => {
                renderJumpLogReviewScreen(activeAthleteId);
            });
            const athleteBtn = document.createElement('button');
            athleteBtn.className = 'button-secondary';
            athleteBtn.textContent = 'View Athlete';
            athleteBtn.addEventListener('click', () => {
                renderAthleteDetailScreen(activeAthleteId);
            });
            topActions.appendChild(reviewBtn);
            topActions.appendChild(athleteBtn);
            container.appendChild(topActions);

            const athleteSelectGroup = document.createElement('div');
            athleteSelectGroup.className = 'field-group';
            athleteSelectGroup.innerHTML = `
                <label>Athlete
                    <select id="athleteSelect">
                        ${athletes
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(a => `<option value="${escapeHtml(a.id)}" ${a.id === activeAthleteId ? 'selected' : ''}>${escapeHtml(a.name)}</option>`)
                            .join('')}
                    </select>
                </label>
            `;
            container.appendChild(athleteSelectGroup);

            const athleteSelectEl = athleteSelectGroup.querySelector('#athleteSelect');
            athleteSelectEl.addEventListener('change', () => {
                renderLogScreen(athleteSelectEl.value);
            });

            const recentSection = document.createElement('div');
            const recentTitle = document.createElement('h3');
            recentTitle.className = 'section-title';
            recentTitle.textContent = 'Recent Jumps';
            recentSection.appendChild(recentTitle);
            const recentJumps = Storage.getJumpsForAthlete(activeAthleteId).slice(0, 3);
            if (recentJumps.length === 0) {
                const emptyRecent = document.createElement('p');
                emptyRecent.textContent = 'No jumps logged yet.';
                recentSection.appendChild(emptyRecent);
            } else {
                const list = document.createElement('ul');
                list.className = 'list';
                recentJumps.forEach(jump => {
                    const li = document.createElement('li');
                    li.className = 'list-item';
                    const barLabel = jump.barHeightInches != null
                        ? (jump.barHeightUnit === 'metric'
                            ? `${(jump.barHeightInches / 39.3701).toFixed(2)} m`
                            : `${Math.floor(jump.barHeightInches / 12)}' ${(jump.barHeightInches % 12).toFixed(1)}"`)
                        : 'No bar';
                    const resultLabel = jump.result ? jump.result.toUpperCase() : '';
                    const dateLabel = resolveJumpDate(jump) ? formatDate(resolveJumpDate(jump)) : '';
                    li.innerHTML = `<span><strong>${barLabel}</strong> ${resultLabel}</span><span>${escapeHtml(dateLabel)}</span>`;
                    li.addEventListener('click', () => {
                        renderJumpDetailScreen(jump.id);
                    });
                    list.appendChild(li);
                });
                recentSection.appendChild(list);
            }
            container.appendChild(recentSection);

            const previousJumps = Storage.getJumpsForAthlete(activeAthleteId);
            const lastJump = previousJumps.length > 0 ? previousJumps[0] : null;
            const lastCompetitionJump = previousJumps.find(jump => jump.sessionType === 'competition') || null;

            function inchesToFeetInches(totalInches) {
                const feet = Math.floor(totalInches / 12);
                const inches = totalInches - feet * 12;
                return { feet, inches };
            }

            function buildOptions(max, selectedValue, start = 1, includeBlank = true) {
                const options = [];
                if (includeBlank) {
                    options.push(`<option value="" ${selectedValue == null ? 'selected' : ''}></option>`);
                }
                for (let i = start; i <= max; i++) {
                    options.push(`<option value="${i}" ${Number(selectedValue) === i ? 'selected' : ''}>${i}</option>`);
                }
                return options.join('');
            }

            const stepsCountVal = lastJump?.stepsCount ?? '';
            const stepsTypeVal = lastJump?.stepsType === 'total'
                ? 'steps'
                : (lastJump?.stepsType ?? (settings.stepsMode === 'steps' ? 'steps' : 'lefts'));
            const barUnitVal = lastJump?.barHeightUnit ?? settings.barUnit;
            const barInchesVal = lastJump?.barHeightInches != null ? parseFloat(lastJump.barHeightInches) : null;
            const approachUnitVal = lastJump?.approachUnit ?? settings.approachUnit;
            const approachInchesVal = lastJump?.approachInches != null ? parseFloat(lastJump.approachInches) : null;
            const takeoffUnitVal = lastJump?.takeoffUnit ?? settings.takeoffUnit;
            const takeoffInchesVal = lastJump?.takeoffInches != null ? parseFloat(lastJump.takeoffInches) : null;
            const gripUnitVal = lastJump?.gripUnit ?? settings.gripUnit;
            const gripInchesVal = lastJump?.gripInches != null ? parseFloat(lastJump.gripInches) : null;
            const standardsUnitVal = lastJump?.standardsUnit ?? settings.standardsUnit;
            const standardsInchesVal = lastJump?.standardsInches != null ? parseFloat(lastJump.standardsInches) : null;
            const lastLanding = lastJump?.landing ?? '';
            const lastPoleBend = lastJump?.poleBend ?? '';
            const notesVal = lastJump?.notes ?? '';
            const sessionTypeDefault = lastJump?.sessionType ?? 'practice';
            const barUpDefault = lastJump?.barUp === false ? 'no' : 'yes';
            const resultDefault = lastJump?.result ?? 'make';

            let barFeetVal = '';
            let barInchesRemVal = '';
            let barMetersVal = '';
            if (barInchesVal != null) {
                if (barUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(barInchesVal);
                    barFeetVal = conv.feet;
                    barInchesRemVal = parseFloat(conv.inches.toFixed(2));
                } else {
                    barMetersVal = (barInchesVal / 39.3701).toFixed(2);
                }
            }

            let approachFeetVal = '';
            let approachInchesRemVal = '';
            let approachMetersVal = '';
            if (approachInchesVal != null) {
                if (approachUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(approachInchesVal);
                    approachFeetVal = conv.feet;
                    approachInchesRemVal = Math.round(conv.inches);
                } else {
                    approachMetersVal = (approachInchesVal / 39.3701).toFixed(2);
                }
            }

            let takeoffFeetVal = '';
            let takeoffInchesRemVal = '';
            let takeoffMetersVal = '';
            if (takeoffInchesVal != null) {
                if (takeoffUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(takeoffInchesVal);
                    takeoffFeetVal = conv.feet;
                    takeoffInchesRemVal = Math.round(conv.inches);
                } else {
                    takeoffMetersVal = (takeoffInchesVal / 39.3701).toFixed(2);
                }
            }

            let gripFeetVal = '';
            let gripInchesRemVal = '';
            let gripMetersVal = '';
            if (gripInchesVal != null) {
                if (gripUnitVal === 'imperial') {
                    const conv = inchesToFeetInches(gripInchesVal);
                    gripFeetVal = conv.feet;
                    gripInchesRemVal = Math.round(conv.inches);
                } else {
                    gripMetersVal = (gripInchesVal / 39.3701).toFixed(2);
                }
            }

            const coachMarkTypeVal = settings.coachMarkType;
            const coachMarkUnitVal = settings.coachMarkUnit;
            const lastCoachDistance = lastJump?.coachMarkInches != null ? parseFloat(lastJump.coachMarkInches) : null;
            const lastCoachStep = lastJump?.coachMarkStep != null ? parseInt(lastJump.coachMarkStep, 10) : null;
            let coachFeetVal = '';
            let coachInchesRemVal = '';
            let coachMetersVal = '';
            let coachStepVal = '';
            if (settings.enableCoachMark) {
                if (coachMarkTypeVal === 'distance') {
                    if (lastCoachDistance != null) {
                        if (coachMarkUnitVal === 'imperial') {
                            const conv = inchesToFeetInches(lastCoachDistance);
                            coachFeetVal = conv.feet;
                            coachInchesRemVal = Math.round(conv.inches);
                        } else {
                            coachMetersVal = (lastCoachDistance / 39.3701).toFixed(2);
                        }
                    }
                } else if (lastCoachStep != null) {
                    coachStepVal = lastCoachStep;
                }
            }

            const savedPoles = Storage.getPoles();
            const poleBrandVal = lastJump?.poleBrand ?? '';
            const poleWeightVal = lastJump?.poleWeight ?? '';
            const poleLengthVal = lastJump?.poleLength ?? '';
            let poleOptionsHtml = '<option value="add-new">Add new pole</option>';
            savedPoles.forEach(pole => {
                const key = `${pole.brand}|${pole.weight}|${pole.length}`;
                const label = `${pole.brand} – ${pole.weight} – ${pole.length}`;
                const selected = (pole.brand === poleBrandVal && pole.weight === poleWeightVal && pole.length === poleLengthVal) ? 'selected' : '';
                poleOptionsHtml += `<option value="${escapeHtml(key)}" ${selected}>${escapeHtml(label)}</option>`;
            });

            const defaultAttempt = (() => {
                if (!lastCompetitionJump) return 1;
                if (lastCompetitionJump.result === 'make') return 1;
                const lastAttempt = Number(lastCompetitionJump.attempt) || 1;
                return Math.min(lastAttempt + 1, 3);
            })();

            const form = document.createElement('form');
            form.innerHTML = `
                <div class="field-group">
                    <label>Session Type</label>
                    <div class="option-buttons" id="sessionTypeRow">
                        <button type="button" data-value="practice" class="option-button ${sessionTypeDefault === 'practice' ? 'selected' : ''}">Practice</button>
                        <button type="button" data-value="competition" class="option-button ${sessionTypeDefault === 'competition' ? 'selected' : ''}">Competition</button>
                    </div>
                </div>
                <div class="field-group" id="attemptGroup" style="display:none;">
                    <label>Attempt</label>
                    <div class="option-buttons" id="attemptButtons">
                        <button type="button" data-value="1" class="option-button ${defaultAttempt === 1 ? 'selected' : ''}">1</button>
                        <button type="button" data-value="2" class="option-button ${defaultAttempt === 2 ? 'selected' : ''}">2</button>
                        <button type="button" data-value="3" class="option-button ${defaultAttempt === 3 ? 'selected' : ''}">3</button>
                    </div>
                </div>
                <div class="field-group" id="barUpGroup">
                    <label>Bar up?</label>
                    <div class="option-buttons" id="barUpRow">
                        <button type="button" data-value="yes" class="option-button ${barUpDefault === 'yes' ? 'selected' : ''}">Yes</button>
                        <button type="button" data-value="no" class="option-button ${barUpDefault === 'no' ? 'selected' : ''}">No</button>
                    </div>
                </div>
                <div class="field-group" id="barHeightGroup">
                    <label>Bar Height</label>
                    <div class="field-row">
                        ${barUnitVal === 'imperial' ? `
                            <input type="number" id="barFeet" class="field-number" value="${escapeHtml(barFeetVal)}" min="0" step="1" inputmode="numeric">
                            <input type="number" id="barInchesInput" class="field-number" value="${escapeHtml(barInchesRemVal)}" min="0" step="0.01" inputmode="decimal">
                            <span class="unit-pill">ft/in</span>
                        ` : `
                            <input type="number" id="barMeters" class="field-number" value="${escapeHtml(barMetersVal)}" min="0" step="0.01" inputmode="decimal">
                            <span class="unit-pill">m</span>
                        `}
                    </div>
                </div>
                ${settings.enableSteps ? `
                    <div class="field-group">
                        <label>Steps</label>
                        <div class="field-row">
                            <select id="stepsCount">
                                ${settings.stepsMode === 'steps'
                                    ? buildOptions(20, stepsCountVal, 1, true)
                                    : buildOptions(10, stepsCountVal, 1, true)}
                            </select>
                            ${settings.stepsMode === 'leftsRights' ? `
                                <select id="stepsType">
                                    <option value="lefts" ${stepsTypeVal === 'lefts' ? 'selected' : ''}>Lefts</option>
                                    <option value="rights" ${stepsTypeVal === 'rights' ? 'selected' : ''}>Rights</option>
                                </select>
                            ` : `
                                <input type="hidden" id="stepsType" value="steps">
                            `}
                        </div>
                    </div>
                ` : ''}
                ${settings.enablePoleSelection ? `
                    <div class="field-group">
                        <label>Pole</label>
                        ${savedPoles.length > 0 ? `
                            <select id="poleSelect">${poleOptionsHtml}</select>
                        ` : `
                            <p class="helper-text">No saved poles yet.</p>
                        `}
                        <div id="poleFields">
                            <label>Brand
                                <input type="text" id="poleBrand" value="${escapeHtml(poleBrandVal)}">
                            </label>
                            <label>Weight Rating
                                <input type="text" id="poleWeight" value="${escapeHtml(poleWeightVal)}">
                            </label>
                            <label>Length
                                <input type="text" id="poleLength" value="${escapeHtml(poleLengthVal)}">
                            </label>
                        </div>
                        <button type="button" class="button-secondary" id="managePolesBtn">Manage Poles</button>
                    </div>
                ` : ''}
                ${settings.enableGripHeight ? `
                    <div class="field-group">
                        <label>Grip Height</label>
                        <div class="field-row">
                            ${gripUnitVal === 'imperial' ? `
                                <input type="number" id="gripFeet" class="field-number" value="${escapeHtml(gripFeetVal)}" min="0" step="1" inputmode="numeric">
                                <select id="gripInchesInput">
                                    ${buildOptions(12, gripInchesRemVal, 1, true)}
                                </select>
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="gripMeters" class="field-number" value="${escapeHtml(gripMetersVal)}" min="0" step="0.01" inputmode="decimal">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </div>
                ` : ''}
                ${settings.enableTakeoffDistance ? `
                    <div class="field-group">
                        <label>Takeoff Step</label>
                        <div class="field-row">
                            ${takeoffUnitVal === 'imperial' ? `
                                <input type="number" id="takeoffFeet" class="field-number" value="${escapeHtml(takeoffFeetVal)}" min="0" step="1" inputmode="numeric">
                                <select id="takeoffInchesInput">
                                    ${buildOptions(12, takeoffInchesRemVal, 1, true)}
                                </select>
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="takeoffMeters" class="field-number" value="${escapeHtml(takeoffMetersVal)}" min="0" step="0.01" inputmode="decimal">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </div>
                ` : ''}
                ${settings.enableApproachDistance ? `
                    <div class="field-group">
                        <label>Approach Distance</label>
                        <div class="field-row">
                            ${approachUnitVal === 'imperial' ? `
                                <input type="number" id="approachFeet" class="field-number" value="${escapeHtml(approachFeetVal)}" min="0" step="1" inputmode="numeric">
                                <select id="approachInchesInput">
                                    ${buildOptions(12, approachInchesRemVal, 1, true)}
                                </select>
                                <span class="unit-pill">ft/in</span>
                            ` : `
                                <input type="number" id="approachMeters" class="field-number" value="${escapeHtml(approachMetersVal)}" min="0" step="0.01" inputmode="decimal">
                                <span class="unit-pill">m</span>
                            `}
                        </div>
                    </div>
                ` : ''}
                ${settings.enableCoachMark ? `
                    <div class="field-group">
                        <label>Coach's Mark</label>
                        <div class="field-row">
                            ${settings.coachMarkType === 'distance' ? `
                                ${settings.coachMarkUnit === 'imperial' ? `
                                    <input type="number" id="coachFeet" class="field-number" value="${escapeHtml(coachFeetVal)}" min="0" step="1" inputmode="numeric">
                                    <select id="coachInchesInput">
                                        ${buildOptions(12, coachInchesRemVal, 1, true)}
                                    </select>
                                    <span class="unit-pill">ft/in</span>
                                ` : `
                                    <input type="number" id="coachMeters" class="field-number" value="${escapeHtml(coachMetersVal)}" min="0" step="0.01" inputmode="decimal">
                                    <span class="unit-pill">m</span>
                                `}
                            ` : `
                                <input type="number" id="coachStep" class="field-number" value="${escapeHtml(coachStepVal)}" min="0" step="1" inputmode="numeric">
                                <span class="unit-pill">steps</span>
                            `}
                        </div>
                        <label class="inline-checkbox">
                            <input type="checkbox" id="hitCoachMark" ${lastJump?.hitCoachMark ? 'checked' : ''}> Hit coach's mark
                        </label>
                    </div>
                ` : ''}
                ${settings.enableTakeoffStepCheck ? `
                    <div class="field-group">
                        <label class="inline-checkbox">
                            <input type="checkbox" id="hitTakeoffStep" ${lastJump?.hitTakeoffStep ? 'checked' : ''}> Hit takeoff step
                        </label>
                    </div>
                ` : ''}
                ${settings.enableStandards ? `
                    <div class="field-group">
                        <label>Standards</label>
                        <div class="field-row">
                            <select id="standardsValue"></select>
                            <span class="unit-pill">${standardsUnitVal === 'cm' ? 'cm' : 'in'}</span>
                        </div>
                    </div>
                ` : ''}
                ${settings.enableLanding ? `
                    <div class="field-group">
                        <label>Landing</label>
                        <div class="option-buttons" id="landingButtons">
                            <button type="button" data-value="shallow" class="option-button ${lastLanding === 'shallow' ? 'selected' : ''}">Shallow</button>
                            <button type="button" data-value="centered" class="option-button ${lastLanding === 'centered' ? 'selected' : ''}">Centered</button>
                            <button type="button" data-value="deep" class="option-button ${lastLanding === 'deep' ? 'selected' : ''}">Deep</button>
                        </div>
                    </div>
                ` : ''}
                ${settings.enablePoleBend ? `
                    <div class="field-group">
                        <label>Pole Bend</label>
                        <div class="option-buttons" id="poleBendButtons">
                            <button type="button" data-value="too-much" class="option-button ${lastPoleBend === 'too-much' ? 'selected' : ''}">Too much</button>
                            <button type="button" data-value="just-right" class="option-button ${lastPoleBend === 'just-right' ? 'selected' : ''}">Just right</button>
                            <button type="button" data-value="too-little" class="option-button ${lastPoleBend === 'too-little' ? 'selected' : ''}">Too little</button>
                        </div>
                    </div>
                ` : ''}
                ${settings.enableNotes ? `
                    <label>Notes (optional)
                        <textarea id="notes">${escapeHtml(notesVal)}</textarea>
                    </label>
                ` : ''}
            `;
            container.appendChild(form);

            const sessionButtons = Array.from(form.querySelectorAll('#sessionTypeRow .option-button'));
            const barUpButtons = Array.from(form.querySelectorAll('#barUpRow .option-button'));
            const attemptButtons = Array.from(form.querySelectorAll('#attemptButtons .option-button'));

            function setSelected(buttons, value) {
                buttons.forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.value === value);
                });
            }

            let sessionType = sessionTypeDefault;
            let barUpValue = barUpDefault;
            let attemptValue = String(defaultAttempt);
            let selectedResult = resultDefault;
            let landingValue = lastLanding || '';
            let poleBendValue = lastPoleBend || '';

            sessionButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    sessionType = btn.dataset.value;
                    setSelected(sessionButtons, sessionType);
                    toggleVisibilityForSession();
                });
            });
            barUpButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    barUpValue = btn.dataset.value;
                    setSelected(barUpButtons, barUpValue);
                    toggleVisibilityForSession();
                });
            });
            attemptButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    attemptValue = btn.dataset.value;
                    setSelected(attemptButtons, attemptValue);
                });
            });

            const landingButtons = Array.from(form.querySelectorAll('#landingButtons .option-button'));
            landingButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    landingValue = btn.dataset.value;
                    setSelected(landingButtons, landingValue);
                });
            });

            const poleBendButtons = Array.from(form.querySelectorAll('#poleBendButtons .option-button'));
            poleBendButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    poleBendValue = btn.dataset.value;
                    setSelected(poleBendButtons, poleBendValue);
                });
            });

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
            resultContainer.id = 'resultContainer';
            container.appendChild(resultContainer);

            function toggleVisibilityForSession() {
                const barHeightGroup = form.querySelector('#barHeightGroup');
                const attemptGroup = form.querySelector('#attemptGroup');
                if (sessionType === 'practice') {
                    const showBar = barUpValue === 'yes';
                    barHeightGroup.style.display = showBar ? 'block' : 'none';
                    resultContainer.style.display = showBar ? 'flex' : 'none';
                    attemptGroup.style.display = 'none';
                } else {
                    barHeightGroup.style.display = 'block';
                    resultContainer.style.display = 'flex';
                    attemptGroup.style.display = 'block';
                }
                form.querySelector('#barUpGroup').style.display = sessionType === 'practice' ? 'block' : 'none';
            }
            toggleVisibilityForSession();

            if (settings.enableStandards) {
                const standardsSelect = form.querySelector('#standardsValue');
                if (standardsSelect) {
                    standardsSelect.innerHTML = '';
                    if (standardsUnitVal === 'cm') {
                        for (let cm = 40; cm <= 80; cm += 5) {
                            standardsSelect.appendChild(new Option(`${cm} cm`, cm));
                        }
                    } else {
                        for (let inch = 18; inch <= 31; inch++) {
                            standardsSelect.appendChild(new Option(`${inch} in`, inch));
                        }
                        standardsSelect.appendChild(new Option('31.5 in', 31.5));
                    }
                    if (standardsInchesVal != null) {
                        let preselect;
                        if (standardsUnitVal === 'cm') {
                            const cmVal = standardsInchesVal / 0.393701;
                            preselect = Math.round(cmVal / 5) * 5;
                            preselect = Math.min(80, Math.max(40, preselect));
                        } else {
                            if (standardsInchesVal > 31) {
                                preselect = 31.5;
                            } else {
                                preselect = Math.round(standardsInchesVal);
                                preselect = Math.min(31, Math.max(18, preselect));
                            }
                        }
                        const match = Array.from(standardsSelect.options).find(opt => parseFloat(opt.value) === parseFloat(preselect));
                        if (match) {
                            match.selected = true;
                        }
                    }
                }
            }

            const managePolesBtn = form.querySelector('#managePolesBtn');
            if (managePolesBtn) {
                managePolesBtn.addEventListener('click', () => {
                    renderPolesScreen();
                });
            }

            const poleSelectEl = form.querySelector('#poleSelect');
            const poleFields = form.querySelector('#poleFields');
            if (poleSelectEl && poleFields) {
                const updatePoleFields = () => {
                    if (poleSelectEl.value === 'add-new') {
                        poleFields.style.display = 'block';
                    } else {
                        poleFields.style.display = 'none';
                    }
                };
                updatePoleFields();
                poleSelectEl.addEventListener('change', () => {
                    updatePoleFields();
                });
            }

            const barHeightInputs = ['#barFeet', '#barInchesInput', '#barMeters']
                .map(selector => form.querySelector(selector))
                .filter(Boolean);
            barHeightInputs.forEach(input => {
                input.addEventListener('input', () => {
                    if (!lastCompetitionJump || lastCompetitionJump.result !== 'make') return;
                    const currentBar = getBarHeightValue();
                    if (currentBar != null && lastCompetitionJump.barHeightInches != null && currentBar !== lastCompetitionJump.barHeightInches) {
                        attemptValue = '1';
                        setSelected(attemptButtons, attemptValue);
                    }
                });
            });

            function getBarHeightValue() {
                if (barUnitVal === 'imperial') {
                    const feetVal = parseFloat(form.querySelector('#barFeet')?.value) || 0;
                    const inchVal = parseFloat(form.querySelector('#barInchesInput')?.value) || 0;
                    const total = feetVal * 12 + inchVal;
                    return total > 0 ? parseFloat(total.toFixed(2)) : null;
                }
                const mVal = parseFloat(form.querySelector('#barMeters')?.value) || 0;
                const total = mVal * 39.3701;
                return total > 0 ? parseFloat(total.toFixed(2)) : null;
            }

            const saveBtn = document.createElement('button');
            saveBtn.className = 'button-primary';
            saveBtn.textContent = 'Add Jump';
            saveBtn.type = 'button';
            saveBtn.addEventListener('click', () => {
                const logAthlete = Storage.getAthlete(athleteSelectEl.value);
                if (!logAthlete) {
                    alert('Select an athlete to log the jump.');
                    return;
                }

                const barHeightInches = getBarHeightValue();
                let stepsCount = null;
                let stepsType = null;
                if (settings.enableSteps) {
                    const stepsCountValue = form.querySelector('#stepsCount')?.value;
                    stepsCount = stepsCountValue ? parseInt(stepsCountValue, 10) : null;
                    stepsType = form.querySelector('#stepsType')?.value || null;
                }

                let poleBrand = '';
                let poleWeight = '';
                let poleLength = '';
                if (settings.enablePoleSelection) {
                    const selectedPole = poleSelectEl?.value || 'add-new';
                    if (selectedPole && selectedPole !== 'add-new') {
                        const parts = selectedPole.split('|');
                        poleBrand = parts[0] || '';
                        poleWeight = parts[1] || '';
                        poleLength = parts[2] || '';
                    } else {
                        poleBrand = form.querySelector('#poleBrand')?.value.trim() || '';
                        poleWeight = form.querySelector('#poleWeight')?.value.trim() || '';
                        poleLength = form.querySelector('#poleLength')?.value.trim() || '';
                    }
                    if (poleBrand || poleWeight || poleLength) {
                        Storage.addPole({ brand: poleBrand, weight: poleWeight, length: poleLength });
                    }
                }

                let gripInchesCalc = null;
                if (settings.enableGripHeight) {
                    if (gripUnitVal === 'imperial') {
                        const feetRaw = form.querySelector('#gripFeet')?.value ?? '';
                        const inchRaw = form.querySelector('#gripInchesInput')?.value ?? '';
                        if (feetRaw !== '' || inchRaw !== '') {
                            const feetVal = parseFloat(feetRaw) || 0;
                            const inchVal = parseFloat(inchRaw) || 0;
                            gripInchesCalc = feetVal * 12 + inchVal;
                        }
                    } else {
                        const mRaw = form.querySelector('#gripMeters')?.value ?? '';
                        if (mRaw !== '') {
                            const mVal = parseFloat(mRaw) || 0;
                            gripInchesCalc = mVal * 39.3701;
                        }
                    }
                }

                let takeoffInchesCalc = null;
                if (settings.enableTakeoffDistance) {
                    if (takeoffUnitVal === 'imperial') {
                        const feetRaw = form.querySelector('#takeoffFeet')?.value ?? '';
                        const inchRaw = form.querySelector('#takeoffInchesInput')?.value ?? '';
                        if (feetRaw !== '' || inchRaw !== '') {
                            const feetVal = parseFloat(feetRaw) || 0;
                            const inchVal = parseFloat(inchRaw) || 0;
                            takeoffInchesCalc = feetVal * 12 + inchVal;
                        }
                    } else {
                        const mRaw = form.querySelector('#takeoffMeters')?.value ?? '';
                        if (mRaw !== '') {
                            const mVal = parseFloat(mRaw) || 0;
                            takeoffInchesCalc = mVal * 39.3701;
                        }
                    }
                }

                let approachInchesCalc = null;
                if (settings.enableApproachDistance) {
                    if (approachUnitVal === 'imperial') {
                        const feetRaw = form.querySelector('#approachFeet')?.value ?? '';
                        const inchRaw = form.querySelector('#approachInchesInput')?.value ?? '';
                        if (feetRaw !== '' || inchRaw !== '') {
                            const feetVal = parseFloat(feetRaw) || 0;
                            const inchVal = parseFloat(inchRaw) || 0;
                            approachInchesCalc = feetVal * 12 + inchVal;
                        }
                    } else {
                        const mRaw = form.querySelector('#approachMeters')?.value ?? '';
                        if (mRaw !== '') {
                            const mVal = parseFloat(mRaw) || 0;
                            approachInchesCalc = mVal * 39.3701;
                        }
                    }
                }

                let coachMarkInchesCalc = null;
                let coachMarkStepCalc = null;
                let hitCoachMark = null;
                if (settings.enableCoachMark) {
                    hitCoachMark = form.querySelector('#hitCoachMark')?.checked || false;
                    if (settings.coachMarkType === 'distance') {
                        if (settings.coachMarkUnit === 'imperial') {
                            const feetRaw = form.querySelector('#coachFeet')?.value ?? '';
                            const inchRaw = form.querySelector('#coachInchesInput')?.value ?? '';
                            if (feetRaw !== '' || inchRaw !== '') {
                                const feetVal = parseFloat(feetRaw) || 0;
                                const inchVal = parseFloat(inchRaw) || 0;
                                coachMarkInchesCalc = feetVal * 12 + inchVal;
                            }
                        } else {
                            const mRaw = form.querySelector('#coachMeters')?.value ?? '';
                            if (mRaw !== '') {
                                const mVal = parseFloat(mRaw) || 0;
                                coachMarkInchesCalc = mVal * 39.3701;
                            }
                        }
                        if (approachInchesCalc != null && coachMarkInchesCalc != null && coachMarkInchesCalc >= approachInchesCalc) {
                            alert("Coach's mark must be less than approach distance.");
                            return;
                        }
                    } else {
                        const stepRaw = form.querySelector('#coachStep')?.value ?? '';
                        coachMarkStepCalc = stepRaw !== '' ? parseInt(stepRaw, 10) : null;
                        if (stepsCount != null && coachMarkStepCalc != null && coachMarkStepCalc >= stepsCount) {
                            alert("Coach's mark step must be less than total steps.");
                            return;
                        }
                    }
                }

                let hitTakeoffStep = null;
                if (settings.enableTakeoffStepCheck) {
                    hitTakeoffStep = form.querySelector('#hitTakeoffStep')?.checked || false;
                }

                let standardsInchesCalc = null;
                if (settings.enableStandards) {
                    const standardsValue = parseFloat(form.querySelector('#standardsValue')?.value);
                    if (!isNaN(standardsValue)) {
                        standardsInchesCalc = standardsUnitVal === 'cm' ? standardsValue * 0.393701 : standardsValue;
                    }
                }

                const notes = settings.enableNotes ? form.querySelector('#notes')?.value || '' : '';

                const jumpData = {
                    createdAt: new Date().toISOString(),
                    sessionType,
                    attempt: sessionType === 'competition' ? parseInt(attemptValue, 10) : null,
                    barUp: sessionType === 'practice' ? barUpValue === 'yes' : null,
                    stepsCount,
                    stepsType,
                    poleBrand,
                    poleWeight,
                    poleLength,
                    gripInches: gripInchesCalc != null ? parseFloat(gripInchesCalc.toFixed(2)) : null,
                    gripUnit: settings.enableGripHeight ? gripUnitVal : null,
                    takeoffInches: takeoffInchesCalc != null ? parseFloat(takeoffInchesCalc.toFixed(2)) : null,
                    takeoffUnit: settings.enableTakeoffDistance ? takeoffUnitVal : null,
                    barHeightInches: barHeightInches != null ? parseFloat(barHeightInches.toFixed(2)) : null,
                    barHeightUnit: barHeightInches != null ? barUnitVal : null,
                    standardsInches: standardsInchesCalc != null ? parseFloat(standardsInchesCalc.toFixed(2)) : null,
                    standardsUnit: standardsInchesCalc != null ? standardsUnitVal : null,
                    result: (sessionType === 'competition' || (sessionType === 'practice' && barUpValue === 'yes')) ? selectedResult : null,
                    notes,
                    approachInches: approachInchesCalc != null ? parseFloat(approachInchesCalc.toFixed(2)) : null,
                    approachUnit: settings.enableApproachDistance ? approachUnitVal : null,
                    coachMarkType: settings.enableCoachMark ? settings.coachMarkType : null,
                    coachMarkInches: settings.enableCoachMark && settings.coachMarkType === 'distance' && coachMarkInchesCalc != null ? parseFloat(coachMarkInchesCalc.toFixed(2)) : null,
                    coachMarkUnit: settings.enableCoachMark && settings.coachMarkType === 'distance' ? settings.coachMarkUnit : null,
                    coachMarkStep: settings.enableCoachMark && settings.coachMarkType === 'step' ? coachMarkStepCalc : null,
                    hitCoachMark: settings.enableCoachMark ? hitCoachMark : null,
                    hitTakeoffStep: settings.enableTakeoffStepCheck ? hitTakeoffStep : null,
                    landing: settings.enableLanding ? landingValue : null,
                    poleBend: settings.enablePoleBend ? poleBendValue : null
                };

                Storage.addJump(logAthlete.id, jumpData);
                renderLogScreen(logAthlete.id);
            });
            container.appendChild(saveBtn);
        });
    }

    /**
     * Render the full jump log review screen grouped by date.
     * @param {string} selectedAthleteId
     */
    function renderJumpLogReviewScreen(selectedAthleteId) {
        navigate(container => {
            const backBtn = document.createElement('button');
            backBtn.textContent = '← Back';
            backBtn.className = 'button-primary';
            backBtn.style.marginBottom = '8px';
            backBtn.addEventListener('click', () => {
                renderLogScreen(selectedAthleteId);
            });
            container.appendChild(backBtn);

            const header = createScreenTitle('Jump Log');
            container.appendChild(header);

            const athletes = Storage.getAthletes();
            if (athletes.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'No athletes available.';
                container.appendChild(empty);
                return;
            }

            const activeAthleteId = selectedAthleteId || athletes[0].id;
            const athleteSelectGroup = document.createElement('div');
            athleteSelectGroup.className = 'field-group';
            athleteSelectGroup.innerHTML = `
                <label>Athlete
                    <select id="reviewAthleteSelect">
                        ${athletes
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(a => `<option value="${escapeHtml(a.id)}" ${a.id === activeAthleteId ? 'selected' : ''}>${escapeHtml(a.name)}</option>`)
                            .join('')}
                    </select>
                </label>
            `;
            container.appendChild(athleteSelectGroup);

            athleteSelectGroup.querySelector('#reviewAthleteSelect').addEventListener('change', e => {
                renderJumpLogReviewScreen(e.target.value);
            });

            const jumps = Storage.getJumpsForAthlete(activeAthleteId);
            if (jumps.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'No jumps logged yet.';
                container.appendChild(empty);
                return;
            }

            const grouped = jumps.reduce((acc, jump) => {
                const date = resolveJumpDate(jump);
                const dateKey = date ? date.toLocaleDateString() : 'Unknown Date';
                if (!acc[dateKey]) {
                    acc[dateKey] = { practice: [], competition: [] };
                }
                const bucket = jump.sessionType === 'competition' ? 'competition' : 'practice';
                acc[dateKey][bucket].push(jump);
                return acc;
            }, {});

            Object.entries(grouped).forEach(([dateKey, buckets]) => {
                const dateTitle = document.createElement('h3');
                dateTitle.className = 'section-title';
                dateTitle.textContent = dateKey;
                container.appendChild(dateTitle);

                ['practice', 'competition'].forEach(type => {
                    if (buckets[type].length === 0) return;
                    const typeLabel = document.createElement('h4');
                    typeLabel.className = 'subsection-title';
                    typeLabel.textContent = type === 'practice' ? 'Practice' : 'Competition';
                    container.appendChild(typeLabel);

                    const list = document.createElement('ul');
                    list.className = 'list';
                    buckets[type].forEach(jump => {
                        const li = document.createElement('li');
                        li.className = 'list-item';
                        const barLabel = jump.barHeightInches != null
                            ? (jump.barHeightUnit === 'metric'
                                ? `${(jump.barHeightInches / 39.3701).toFixed(2)} m`
                                : `${Math.floor(jump.barHeightInches / 12)}' ${(jump.barHeightInches % 12).toFixed(1)}"`)
                            : 'No bar';
                        const resultLabel = jump.result ? jump.result.toUpperCase() : '';
                        const attemptLabel = jump.attempt ? `Attempt ${jump.attempt}` : '';
                        li.innerHTML = `<span><strong>${barLabel}</strong> ${resultLabel}</span><span>${escapeHtml(attemptLabel)}</span>`;
                        li.addEventListener('click', () => {
                            renderJumpDetailScreen(jump.id);
                        });
                        list.appendChild(li);
                    });
                    container.appendChild(list);
                });
            });
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
            const header = createScreenTitle(`${athlete?.name || ''} – Jump Detail`);
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
            // Approach mark display
            if (jump.approachInches != null) {
                let approachDisplay;
                if (jump.approachUnit === 'metric') {
                    const m = (jump.approachInches / 39.3701).toFixed(2);
                    approachDisplay = `${m} m`;
                } else {
                    const total = parseFloat(jump.approachInches);
                    const ft = Math.floor(total / 12);
                    const inch = Math.round(total - ft * 12);
                    approachDisplay = `${ft}' ${inch}"`;
                }
                addItem('Approach Mark', approachDisplay);
            }
            // Coach mark display
            if (jump.coachMarkType) {
                let coachDisplay = '';
                if (jump.coachMarkType === 'distance' && jump.coachMarkInches != null) {
                    if (jump.coachMarkUnit === 'metric') {
                        const m = (jump.coachMarkInches / 39.3701).toFixed(2);
                        coachDisplay = `${m} m`;
                    } else {
                        const total = parseFloat(jump.coachMarkInches);
                        const ft = Math.floor(total / 12);
                        const inch = Math.round(total - ft * 12);
                        coachDisplay = `${ft}' ${inch}"`;
                    }
                } else if (jump.coachMarkType === 'step' && jump.coachMarkStep != null) {
                    coachDisplay = `${jump.coachMarkStep} steps`;
                }
                if (coachDisplay) {
                    addItem("Coach's Mark", coachDisplay);
                }
                // Hit coach mark
                if (jump.hitCoachMark != null) {
                    addItem("Hit Coach's Mark", jump.hitCoachMark ? 'Yes' : 'No');
                }
            }
            // Takeoff step hit display
            if (jump.hitTakeoffStep != null) {
                addItem('Hit Takeoff Step', jump.hitTakeoffStep ? 'Yes' : 'No');
            }
            if (jump.sessionType) {
                addItem('Session Type', jump.sessionType.charAt(0).toUpperCase() + jump.sessionType.slice(1));
            }
            if (jump.sessionType === 'competition' && jump.attempt != null) {
                addItem('Attempt', jump.attempt);
            }
            if (jump.sessionType === 'practice' && jump.barUp != null) {
                addItem('Bar Up', jump.barUp ? 'Yes' : 'No');
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
            addItem('Result', jump.result || '');
            if (jump.landing) {
                addItem('Landing', jump.landing);
            }
            if (jump.poleBend) {
                addItem('Pole Bend', jump.poleBend);
            }
            addItem('Notes', jump.notes || '');
            const recordedDate = resolveJumpDate(jump);
            addItem('Recorded', recordedDate ? formatDate(recordedDate) : '');

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
