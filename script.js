// script.js
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const db = getFirestore();

const loadoutData = {
    primary_weapons: [],
    secondary_weapons: [],
    perks_red: [],
    perks_green: [],
    perks_blue: [],
    lethal_throwables: [],
    tactical_throwables: [],
    scorestreaks: [],
    operator_skills: []
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
    if (Object.keys(loadoutData).length === 0) {
        alert("Loadout data is not ready.");
        return;
    }

    // Standard Items
    document.getElementById('perk-red').textContent = getRandomItem(loadoutData.perks_red) || 'N/A';
    document.getElementById('perk-green').textContent = getRandomItem(loadoutData.perks_green) || 'N/A';
    document.getElementById('perk-blue').textContent = getRandomItem(loadoutData.perks_blue) || 'N/A';
    document.getElementById('lethal').textContent = getRandomItem(loadoutData.lethal_throwables) || 'N/A';
    document.getElementById('tactical').textContent = getRandomItem(loadoutData.tactical_throwables) || 'N/A';
    document.getElementById('operator-skill').textContent = getRandomItem(loadoutData.operator_skills) || 'N/A';
    
    // Weapons
    generateWeapon('primary', 'primary-weapon', 'primary-attachments', 5);
    generateWeapon('secondary', 'secondary-weapon', 'secondary-attachments', 5);

    // Scorestreaks
    const scorestreaks = [...loadoutData.scorestreaks];
    if (scorestreaks.length >= 3) {
        for (let i = scorestreaks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scorestreaks[i], scorestreaks[j]] = [scorestreaks[j], scorestreaks[i]];
        }
        document.getElementById('scorestreak-1').textContent = scorestreaks[0];
        document.getElementById('scorestreak-2').textContent = scorestreaks[1];
        document.getElementById('scorestreak-3').textContent = scorestreaks[2];
    } else {
        document.getElementById('scorestreak-1').textContent = scorestreaks[0] || 'N/A';
        document.getElementById('scorestreak-2').textContent = scorestreaks[1] || 'N/A';
        document.getElementById('scorestreak-3').textContent = scorestreaks[2] || 'N/A';
    }
}

function generateWeapon(type, weaponElId, attachmentsElId, attachmentCount) {
    const weaponData = getRandomItem(loadoutData[`${type}_weapons`]);
    const weaponNameEl = document.getElementById(weaponElId);
    const attachmentsListEl = document.getElementById(attachmentsElId);

    weaponNameEl.textContent = weaponData ? weaponData.name : 'N/A';
    attachmentsListEl.innerHTML = '';

    if (!weaponData || !weaponData.attachments || Object.keys(weaponData.attachments).length === 0) {
        return;
    }

    let availableCategories = Object.keys(weaponData.attachments);
    for (let i = availableCategories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCategories[i], availableCategories[j]] = [availableCategories[j], availableCategories[i]];
    }

    const numToSelect = Math.min(attachmentCount, availableCategories.length);
    const selectedCategories = availableCategories.slice(0, numToSelect);

    // --- MODIFICATION START ---
    // Instead of just getting the name, we now get an object with the type and name.
    const finalAttachments = selectedCategories.map(category => {
        return {
            type: category,
            name: getRandomItem(weaponData.attachments[category])
        };
    });

    finalAttachments.forEach(attachment => {
        if (attachment && attachment.name) {
            const li = document.createElement('li');
            // This function formats the type name nicely (e.g., "rear_grip" -> "Rear Grip")
            const formattedType = attachment.type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            // We now include the formatted type in the text content.
            li.textContent = `${formattedType}: ${attachment.name}`;
            attachmentsListEl.appendChild(li);
        }
    });
    // --- MODIFICATION END ---
}

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = "Loading Data...";
    fetchData();
    generateBtn.addEventListener('click', generateRandomLoadout);
});
