// admin.script.js
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const db = getFirestore();

// --- CONFIGURATION ---
const OTHER_CATEGORIES = [
    { id: 'perks_red', name: 'Red Perks' },
    { id: 'perks_green', name: 'Green Perks' },
    { id: 'perks_blue', name: 'Blue Perks' },
    { id: 'lethal_throwables', name: 'Lethals' },
    { id: 'tactical_throwables', name: 'Tacticals' },
];
const ATTACHMENT_TYPES = ['optic', 'muzzle', 'barrel', 'laser', 'underbarrel', 'ammunition', 'rear_grip', 'stock', 'weapon_perk', 'trigger_action'];

// --- STATE MANAGEMENT ---
let currentWeaponListUnsubscribe = null;
let currentOtherUnsubscribe = null;
let isEditMode = false;
let weaponDataStore = {}; // Local cache for all weapon data, used by the template system

// --- DOM ELEMENTS ---
const addWeaponForm = document.getElementById('add-weapon-form');
const weaponFormTitle = document.getElementById('weapon-form-title');
const weaponSubmitBtn = document.getElementById('weapon-submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const weaponNameInput = document.getElementById('weapon-name');
const weaponCategorySelect = document.getElementById('weapon-category-select');
const templateWeaponSelect = document.getElementById('template-weapon-select');
const attachmentFieldsContainer = document.getElementById('attachment-fields-container');

// --- CORE FUNCTIONS ---
function resetWeaponForm() {
    addWeaponForm.reset();
    weaponFormTitle.textContent = "Add New Weapon";
    weaponSubmitBtn.textContent = "Add Weapon";
    cancelEditBtn.classList.add('hidden');
    weaponNameInput.disabled = false;
    weaponCategorySelect.disabled = false;
    isEditMode = false;
}

addWeaponForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = weaponCategorySelect.value;
    const name = weaponNameInput.value.trim();
    if (!category || !name) return alert('Please select a category and enter a weapon name.');

    const attachments = {};
    ATTACHMENT_TYPES.forEach(type => {
        const textarea = document.getElementById(`attach-${type}`);
        const values = textarea.value.split(',').map(s => s.trim()).filter(Boolean);
        if (values.length > 0) attachments[type] = values;
    });

    try {
        await setDoc(doc(db, category, name), { name, attachments });
        alert(`Successfully ${isEditMode ? 'updated' : 'added'} "${name}".`);
        resetWeaponForm();
    } catch (error) {
        console.error("Error saving weapon: ", error);
        alert('Failed to save weapon. Check console for details.');
    }
});

cancelEditBtn.addEventListener('click', resetWeaponForm);

function populateFormForEdit(category, weaponName) {
    const weapon = weaponDataStore[weaponName];
    if (!weapon) return alert("Weapon data not found! It may have been deleted.");
    
    isEditMode = true;
    weaponFormTitle.textContent = `Editing: ${weapon.name}`;
    weaponSubmitBtn.textContent = "Update Weapon";
    cancelEditBtn.classList.remove('hidden');
    weaponNameInput.value = weapon.name;
    weaponNameInput.disabled = true;
    weaponCategorySelect.value = category;
    weaponCategorySelect.disabled = true;

    ATTACHMENT_TYPES.forEach(type => {
        document.getElementById(`attach-${type}`).value = '';
    });

    for (const [type, values] of Object.entries(weapon.attachments)) {
        if (ATTACHMENT_TYPES.includes(type)) {
            document.getElementById(`attach-${type}`).value = values.join(', ');
        }
    }
    window.scrollTo(0, 0);
}

// --- TEMPLATE AND WEAPON LIST LOGIC (REBUILT FOR RELIABILITY) ---

// This function just renders the dropdown based on the current data store
function renderTemplateSelector() {
    const currentSelection = templateWeaponSelect.value;
    templateWeaponSelect.innerHTML = '<option value="">-- Select a Template Weapon --</option>';
    
    const sortedWeaponNames = Object.keys(weaponDataStore).sort();
    sortedWeaponNames.forEach(weaponName => {
        const weapon = weaponDataStore[weaponName];
        const prefix = weapon.category === 'primary_weapons' ? 'Primary' : 'Secondary';
        const option = new Option(`${prefix}: ${weaponName}`, weaponName);
        templateWeaponSelect.add(option);
    });

    if (weaponDataStore[currentSelection]) {
        templateWeaponSelect.value = currentSelection;
    }
}

// This is a dedicated listener that runs once to keep the template data fresh
function initializeTemplateListener() {
    const collections = ['primary_weapons', 'secondary_weapons'];
    collections.forEach(category => {
        onSnapshot(collection(db, category), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const docId = change.doc.id;
                if (change.type === "removed") {
                    delete weaponDataStore[docId];
                } else {
                    weaponDataStore[docId] = { ...change.doc.data(), category: category };
                }
            });
            renderTemplateSelector(); // Re-render the dropdown after any change
        });
    });
}

attachmentFieldsContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('copy-btn')) return;
    const templateName = templateWeaponSelect.value;
    if (!templateName) return alert("Please select a template weapon first.");
    
    const attachmentType = e.target.dataset.type;
    const templateWeapon = weaponDataStore[templateName];

    if (templateWeapon?.attachments?.[attachmentType]) {
        document.getElementById(`attach-${attachmentType}`).value = templateWeapon.attachments[attachmentType].join(', ');
    } else {
        alert(`No '${attachmentType}' attachments found for ${templateName}.`);
    }
});

// This function now ONLY displays the list of weapons, it doesn't manage template data
function listenToWeaponList(category) {
    const container = document.getElementById('weapon-list-container');
    if (currentWeaponListUnsubscribe) currentWeaponListUnsubscribe();

    currentWeaponListUnsubscribe = onSnapshot(collection(db, category), (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<p>No weapons found in the "${category.replace('_', ' ')}" category.</p>`;
            return;
        }
        container.innerHTML = snapshot.docs.map(doc => `
            <div class="weapon-card" data-id="${doc.id}" data-category="${category}">
                <div class="weapon-card-header">
                    <h4>${doc.id}</h4>
                    <button class="delete-btn" data-id="${doc.id}" data-category="${category}">Delete</button>
                </div>
            </div>
        `).join('');
    });
}

document.getElementById('weapon-list-container').addEventListener('click', (e) => {
    const card = e.target.closest('.weapon-card');
    if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        const { id, category } = e.target.dataset;
        if (confirm(`Are you sure you want to delete ${id}?`)) {
            deleteDoc(doc(db, category, id));
        }
    } else if (card) {
        const { id, category } = card.dataset;
        populateFormForEdit(category, id);
    }
});

// --- PERKS & EQUIPMENT TAB LOGIC ---
// (This section remains unchanged)
const addItemForm = document.getElementById('add-item-form');
addItemForm.addEventListener('submit', async (e) => { e.preventDefault(); const category = document.getElementById('category-select').value; const name = document.getElementById('item-name').value.trim(); if (!category || !name) return; await addDoc(collection(db, category), { name }); document.getElementById('item-name').value = ''; alert('Item added.'); });
function displayOtherCategoryButtons() { const container = document.getElementById('other-category-buttons'); container.innerHTML = OTHER_CATEGORIES.map(cat => `<button class="category-btn" data-id="${cat.id}" data-name="${cat.name}">${cat.name}</button>`).join(''); container.addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { const { id, name } = e.target.dataset; viewOtherCategory(id, name); document.querySelectorAll('#other-category-buttons .category-btn').forEach(btn => btn.classList.remove('active')); e.target.classList.add('active'); } }); }
function viewOtherCategory(categoryId, categoryName) { document.getElementById('current-category-title').textContent = `Items in: ${categoryName}`; const tableContainer = document.getElementById('item-table-container'); if (currentOtherUnsubscribe) currentOtherUnsubscribe(); currentOtherUnsubscribe = onSnapshot(collection(db, categoryId), (snapshot) => { if (snapshot.empty) { tableContainer.innerHTML = `<p>No items found in "${categoryName}".</p>`; return; } const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); tableContainer.innerHTML = `<table><thead><tr><th>Name</th><th>Action</th></tr></thead><tbody>${items.map(item => `<tr><td>${item.name}</td><td><button class="delete-btn" data-id="${item.id}" data-category="${categoryId}">Delete</button></td></tr>`).join('')}</tbody></table>`; }); }
document.getElementById('item-table-container').addEventListener('click', async (e) => { if (e.target.classList.contains('delete-btn')) { const { id, category } = e.target.dataset; if (confirm('Are you sure?')) { await deleteDoc(doc(db, category, id)); } } });

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const viewPrimaryBtn = document.getElementById('view-primary-btn');
    const viewSecondaryBtn = document.getElementById('view-secondary-btn');

    viewPrimaryBtn.addEventListener('click', () => {
        listenToWeaponList('primary_weapons');
        viewPrimaryBtn.classList.add('active');
        viewSecondaryBtn.classList.remove('active');
    });

    viewSecondaryBtn.addEventListener('click', () => {
        listenToWeaponList('secondary_weapons');
        viewSecondaryBtn.classList.add('active');
        viewPrimaryBtn.classList.remove('active');
    });

    // Run all the setup functions
    initializeTemplateListener(); // This will populate the dropdown
    listenToWeaponList('primary_weapons'); // This will show the initial list of primary weapons
    displayOtherCategoryButtons();
    document.getElementById('current-category-title').textContent = 'Select a category to view items';
    document.getElementById('item-table-container').innerHTML = '<p>No category selected.</p>';
});
