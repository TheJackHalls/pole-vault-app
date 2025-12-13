/*
 * Storage module encapsulates all data persistence operations. It stores
 * athletes and jumps in localStorage under a single key. Each athlete
 * and jump object includes a UUID. Future improvements (cloud sync,
 * multi‑device) can reuse this abstraction with minimal changes.
 */

const Storage = (() => {
    const STORAGE_KEY = 'poleVaultData';

    /**
     * Generate a simple UUID v4 string. Taken from stackoverflow.
     * @returns {string}
     */
    function uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    /**
     * Load the complete data object from localStorage. If none exists,
     * return a default structure.
     * @returns {{athletes: Array, jumps: Array}}
     */
    function loadData() {
        const dataStr = localStorage.getItem(STORAGE_KEY);
        if (!dataStr) {
            // include poles array for saved pole combinations
            return { athletes: [], jumps: [], poles: [] };
        }
        try {
            const parsed = JSON.parse(dataStr);
            // ensure keys exist
            return {
                athletes: parsed.athletes || [],
                jumps: parsed.jumps || [],
                poles: parsed.poles || [],
            };
        } catch (e) {
            console.error('Error parsing stored data', e);
            return { athletes: [], jumps: [], poles: [] };
        }
    }

    /**
     * Persist the entire data object back to localStorage.
     * @param {{athletes: Array, jumps: Array}} data
     */
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Add a pole definition to the list of saved poles. A pole is defined
     * by brand, weight, and length. Duplicate combinations are ignored.
     * @param {{brand: string, weight: string, length: string}} poleData
     */
    function addPole(poleData) {
        const data = loadData();
        const exists = data.poles.some(p =>
            p.brand === poleData.brand &&
            p.weight === poleData.weight &&
            p.length === poleData.length
        );
        if (!exists) {
            // store new pole combination
            data.poles.push({
                brand: poleData.brand,
                weight: poleData.weight,
                length: poleData.length
            });
            saveData(data);
        }
    }

    /**
     * Retrieve all saved pole combinations.
     * @returns {Array<{brand: string, weight: string, length: string}>}
     */
    function getPoles() {
        const data = loadData();
        const poles = data.poles || [];
        // sort poles by length (numeric), then weight (numeric), then brand (string)
        return poles.slice().sort((a, b) => {
            // parse numeric values; fallback to original string if NaN
            const lenA = parseFloat(a.length);
            const lenB = parseFloat(b.length);
            if (!isNaN(lenA) && !isNaN(lenB) && lenA !== lenB) {
                return lenA - lenB;
            }
            const weightA = parseFloat(a.weight);
            const weightB = parseFloat(b.weight);
            if (!isNaN(weightA) && !isNaN(weightB) && weightA !== weightB) {
                return weightA - weightB;
            }
            // compare brand strings last (case-insensitive)
            const brandA = (a.brand || '').toLowerCase();
            const brandB = (b.brand || '').toLowerCase();
            return brandA.localeCompare(brandB);
        });
    }

    /**
     * Return all athletes sorted alphabetically by name.
     * @returns {Array}
     */
    function getAthletes() {
        const data = loadData();
        return data.athletes.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Retrieve an athlete by id.
     * @param {string} id
     * @returns {object|null}
     */
    function getAthlete(id) {
        const data = loadData();
        return data.athletes.find(a => a.id === id) || null;
    }

    /**
     * Add a new athlete. Returns the created athlete object.
     * @param {{name: string, gender: string, weightLbs: number}} athleteData
     * @returns {object}
     */
    function addAthlete(athleteData) {
        const data = loadData();
        const newAthlete = {
            id: uuidv4(),
            name: athleteData.name.trim(),
            gender: athleteData.gender,
            weightLbs: Number(athleteData.weightLbs),
        };
        data.athletes.push(newAthlete);
        saveData(data);
        return newAthlete;
    }

    /**
     * Return all jumps for a given athlete sorted by most recent first.
     * @param {string} athleteId
     * @returns {Array}
     */
    function getJumpsForAthlete(athleteId) {
        const data = loadData();
        return data.jumps.filter(j => j.athleteId === athleteId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Retrieve a jump by id.
     * @param {string} jumpId
     * @returns {object|null}
     */
    function getJumpById(jumpId) {
        const data = loadData();
        return data.jumps.find(j => j.id === jumpId) || null;
    }

    /**
     * Add a new jump associated with an athlete.
     * @param {string} athleteId
     * @param {object} jumpData
     * @returns {object}
     */
    function addJump(athleteId, jumpData) {
        const data = loadData();
        const newJump = Object.assign({}, jumpData, {
            id: uuidv4(),
            athleteId,
            createdAt: new Date().toISOString(),
        });
        data.jumps.push(newJump);
        saveData(data);
        return newJump;
    }

    /**
     * Export all data as a JSON blob. Returns a data URI string that can be used
     * to download the file.
     * @returns {string}
     */
    function exportData() {
        const data = loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        return window.URL.createObjectURL(blob);
    }

    return {
        loadData,
        saveData,
        getAthletes,
        getAthlete,
        addAthlete,
        getJumpsForAthlete,
        getJumpById,
        addJump,
        exportData,
        uuidv4,
        addPole,
        getPoles,
    };
})();