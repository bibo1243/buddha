import * as XLSX from 'xlsx';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove, child, onValue } from 'firebase/database';

const EXCEL_FILE = '/摸彩名單.xlsx';
const LS_PREFIX = 'voting_app_';

// --- LocalStorage Logic (Offline / Default) ---
class LocalDB {
    constructor() {
        console.log('Using LocalStorage DB (Offline Mode)');
        if (!localStorage.getItem(LS_PREFIX + 'groups')) {
            this.setGroups(['Group A', 'Group B', 'Group C']);
        }
        if (!localStorage.getItem(LS_PREFIX + 'config')) {
            this.setConfig({ maxVotes: 3, title: '慈馨活動' });
        }
    }

    get isOnline() { return false; }

    getGroups() {
        return Promise.resolve(JSON.parse(localStorage.getItem(LS_PREFIX + 'groups') || '[]'));
    }

    setGroups(groups) {
        localStorage.setItem(LS_PREFIX + 'groups', JSON.stringify(groups));
        return Promise.resolve();
    }

    getConfig() {
        return Promise.resolve(JSON.parse(localStorage.getItem(LS_PREFIX + 'config') || '{}'));
    }

    setConfig(config) {
        localStorage.setItem(LS_PREFIX + 'config', JSON.stringify(config));
        return Promise.resolve();
    }

    getVotes() {
        return Promise.resolve(JSON.parse(localStorage.getItem(LS_PREFIX + 'votes') || '{}'));
    }

    submitVote(user, votes) {
        return this.getVotes().then(allVotes => {
            if (allVotes[user]) {
                return Promise.reject('已經投過票囉！');
            }
            allVotes[user] = {
                choices: votes,
                timestamp: Date.now()
            };
            localStorage.setItem(LS_PREFIX + 'votes', JSON.stringify(allVotes));
            // Trigger storage event for cross-tab updates (simulated realtime)
            window.dispatchEvent(new Event('storage'));
            return Promise.resolve();
        });
    }

    resetVotes() {
        localStorage.removeItem(LS_PREFIX + 'votes');
        window.dispatchEvent(new Event('storage'));
        return Promise.resolve();
    }

    subscribeVotes(callback) {
        // Poll or listen to storage event
        const handler = () => {
            this.getVotes().then(callback);
        };
        window.addEventListener('storage', handler);
        // Initial call
        handler();
        return () => window.removeEventListener('storage', handler);
    }
}

// --- Firebase Logic (Online) ---
class FirebaseDB {
    constructor(config) {
        console.log('Using Firebase Realtime DB (Online Mode)');
        this.app = initializeApp(config);
        this.db = getDatabase(this.app);
    }

    get isOnline() { return true; }

    async getGroups() {
        try {
            const snapshot = await get(ref(this.db, 'groups'));
            return snapshot.val() || ['第一組', '第二組', '第三組'];
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async setGroups(groups) {
        return set(ref(this.db, 'groups'), groups);
    }

    async getConfig() {
        const snapshot = await get(ref(this.db, 'config'));
        return snapshot.val() || { maxVotes: 3 };
    }

    async setConfig(config) {
        return set(ref(this.db, 'config'), config);
    }

    async getVotes() {
        const snapshot = await get(ref(this.db, 'votes'));
        return snapshot.val() || {};
    }

    subscribeVotes(callback) {
        const votesRef = ref(this.db, 'votes');
        const unsubscribe = onValue(votesRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
        return unsubscribe;
    }

    async submitVote(user, votes) {
        // Simple check if already voted
        const userRef = ref(this.db, 'votes/' + user);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return Promise.reject('已經投過票囉！');
        }

        // Save as object with timestamp
        const voteData = {
            choices: votes,
            timestamp: Date.now()
        };
        return set(userRef, voteData);
    }

    async resetVotes() {
        // Warning: This destroys data
        return remove(ref(this.db, 'votes'));
    }

    async simulateVotes(count, groups, clear = false) {
        if (!groups || groups.length < 2) return Promise.reject("Not enough groups");

        if (clear) {
            await this.resetVotes();
        }

        let updates = {};
        const startTime = Date.now();

        for (let i = 1; i <= count; i++) {
            const user = `sim_user_${startTime}_${i}`; // Unique ID

            // Randomly pick 1 choice for each category
            const randomPick = () => groups[Math.floor(Math.random() * groups.length)];

            const choices = {
                warm: randomPick(),
                fun: randomPick(),
                creative: randomPick()
            };

            // Sequential timestamp to ensure strict race order influence
            // Each vote is 100ms apart
            const voteTime = startTime + (i * 100);

            updates[`votes/${user}`] = {
                choices: choices,
                timestamp: voteTime
            };
        }

        const promises = Object.entries(updates).map(([path, data]) => {
            return set(ref(this.db, path), data);
        });

        return Promise.all(promises);
    }
}

// --- Factory ---
export const db = firebaseConfig ? new FirebaseDB(firebaseConfig) : new LocalDB();

// --- Helper: Verify User from Markdown List ---
export async function verifyUser(name) {
    try {
        const response = await fetch('/員工名單.md');
        if (!response.ok) throw new Error('無法讀取名單 (List not found)');

        const text = await response.text();
        // Split by new line and trim
        const allNames = text.split('\n').map(n => n.trim()).filter(n => n);

        if (allNames.includes(name.trim())) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        throw new Error('名單驗證失敗 (Verification Error)');
    }
}
