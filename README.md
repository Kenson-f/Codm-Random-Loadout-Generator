Call of Duty: Mobile - Random Loadout Generator

A full-stack web application that generates random weapon and perk loadouts for the game Call of Duty: Mobile. This project demonstrates a complete front-to-back development cycle, from user interface design to real-time database management and cloud deployment.

Live Demo URL: https://codm-random-loadout-generator.web.app

Features

    Random Loadout Generation: Creates a complete loadout including a primary weapon, secondary weapon, five attachments for each, three character perks, and lethal/tactical equipment.

    Real-Time Database: Utilizes Google Firebase's Firestore to fetch all weapon and item data in real-time, ensuring the generator is always up-to-date.

    Comprehensive Admin Panel: A separate, feature-rich admin page allows for full CRUD (Create, Read, Update, Delete) management of all in-game items.

    Dynamic & Interactive Forms:

        Click any existing weapon to load its data into the form for easy editing.

        Use the template system to select an existing weapon and instantly copy its attachments to a new weapon's form, dramatically speeding up data entry.

    Responsive Design: The user interface is fully responsive and provides a seamless experience on both desktop and mobile devices.

Tech Stack

    Frontend: HTML5, CSS3, Modern JavaScript (ES6+ Modules, Async/Await)

    Backend & Database: Google Firebase (Firestore)

    Deployment: Firebase Hosting

How to Use
Main Generator (index.html)

Simply open the live demo URL and click the "Generate Loadout" button. A new, random loadout will be displayed.
Admin Panel (admin.html)

To manage the data, navigate to /admin.html on the live site.

    Adding Items: Use the forms to add new weapons (with their specific attachments) or new perks/equipment.

    Editing Weapons: Click on any weapon card from the "Existing Weapons" list. The weapon's data will populate the form at the top, allowing you to modify its attachments and update it.

    Deleting Items: Click the "Delete" button on any item card to permanently remove it from the database.
