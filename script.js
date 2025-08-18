// script.js
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// This script assumes Firebase is already initialized in the HTML file
const db = getFirestore();

const loadoutData = {
    primary_weapons: [],
    secondary_weapons: [],
    perks_red: [],
    perks_green: [],
    perks_blue: [],
    lethal_throwables: [],
    tactical_throwables: []
};

async function fetchData() {
    console.log("Fetching data from Firestore...");
    try {
        const collectionsToFetch = Object.keys(loadoutData);
        for (const colName of collectionsToFetch) {
            const querySnapshot = await getDocs(collection(db, colName));
            if (colName.includes('weapons')) {
                loadoutData[colName] = querySnapshot.docs.map(doc => doc.data());
            } else {
                loadoutData[colName] = querySnapshot.docs.map(doc => doc.data().name);
            }
        }
        console.log("Data fetched successfully:", loadoutData);
        document.getElementById('generate-btn').disabled = false;
        document.getElementById('generate-btn').textContent = "Generate Loadout";
    } catch (error) {
        console.error("Error fetching data: ", error);
        alert("Could not fetch loadout data. Please check the console and ensure you have added items in the admin panel.");
    }
}

function getRandomItem(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

function generateRandomLoadout() {
    if (loadoutData.primary_weapons.length === 0 && loadoutData.perks_red.length === 0) {
        alert("Loadout data is empty. Please add items via the admin panel.");
        return;
    }

    document.getElementById('perk-red').textContent = getRandomItem(loadoutData.perks_red) || 'N/A';
    document.getElementById('perk-green').textContent = getRandomItem(loadoutData.perks_green) || 'N/A';
    document.getElementById('perk-blue').textContent = getRandomItem(loadoutData.perks_blue) || 'N/A';
    document.getElementById('lethal').textContent = getRandomItem(loadoutData.lethal_throwables) || 'N/A';
    document.getElementById('tactical').textContent = getRandomItem(loadoutData.tactical_throwables) || 'N/A';
    
    generateWeapon('primary', 'primary-weapon', 'primary-attachments', 5);
    generateWeapon('secondary', 'secondary-weapon', 'secondary-attachments', 5);
}

// --- MODIFICATION START ---
// This function has been completely rewritten to ensure unique attachment categories.
function generateWeapon(type, weaponElId, attachmentsElId, attachmentCount) {
    const weaponData = getRandomItem(loadoutData[`${type}_weapons`]);
    const weaponNameEl = document.getElementById(weaponElId);
    const attachmentsListEl = document.getElementById(attachmentsElId);

    // Reset the display
    weaponNameEl.textContent = weaponData ? weaponData.name : 'N/A';
    attachmentsListEl.innerHTML = '';

    if (!weaponData || !weaponData.attachments || Object.keys(weaponData.attachments).length === 0) {
        return; // Exit if there's no weapon or no attachments for it
    }

    // 1. Get all available attachment categories for this weapon (e.g., 'muzzle', 'barrel', etc.)
    let availableCategories = Object.keys(weaponData.attachments);

    // 2. Shuffle the categories array randomly (Fisher-Yates shuffle)
    for (let i = availableCategories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCategories[i], availableCategories[j]] = [availableCategories[j], availableCategories[i]];
    }

    // 3. Determine how many attachments to select (the requested count or fewer if not enough categories exist)
    const numToSelect = Math.min(attachmentCount, availableCategories.length);

    // 4. Take the first 'numToSelect' categories from the shuffled list. This guarantees they are unique.
    const selectedCategories = availableCategories.slice(0, numToSelect);

    // 5. For each uniquely selected category, pick one random attachment
    const finalAttachments = selectedCategories.map(category => {
        return getRandomItem(weaponData.attachments[category]);
    });

    // 6. Display the final list of attachments
    finalAttachments.forEach(attachment => {
        if (attachment) { // Ensure the attachment is not null/undefined
            const li = document.createElement('li');
            li.textContent = attachment;
            attachmentsListEl.appendChild(li);
        }
    });
}
// --- MODIFICATION END ---

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = "Loading Data...";
    fetchData();
    generateBtn.addEventListener('click', generateRandomLoadout);
});
