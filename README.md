![ZparkWise Logo Image](https://github.com/CellectIO/ZparkWise/blob/develop/src/assets/images/logos/icon-small.png?raw=true)

# ZparkWise SA Loadshedding Chrome Extension

![ZparkWise Promo Image](https://github.com/CellectIO/ZparkWise/blob/develop/src/assets/images/promo/promo-1.png?raw=true)

---

# ⚠️ Disclaimer
This project is completely independent and has no affiliation, endorsement, or partnership with **WellWellWell Investments (Pty) Ltd ("ESP")**.

## 🚨 Important Notice
- This extension does **NOT** provide or control services provided from **WellWellWell Investments (Pty) Ltd ("ESP")**.
- ESP may have its own **terms, policies, and restrictions**.
- Users should carefully review ESP’s rules, API terms, and privacy policies before registering.

## 🔗 Important Links from ESP
- https://esp.info/
- https://esp.info/privacy

## 📝 License
This project is licensed under the **MIT** license.

See the LICENSE file for full details.

---

## Installation Guide

![ZparkWise Installation gif](./src/assets/images/promo/installation.gif)

---

## Project Overview
The ZparkWise SA Loadshedding Chrome Extension is designed to visualize data from the publicly available Eskom Se Push (ESP) API.

## Features
- Access the latest information on load shedding schedules.
- A simplistic design for easy navigation and data interpretation.
- Cache configuration to save on API call count (if you are using a free account)

![ZparkWise Promo Image](https://github.com/CellectIO/ZparkWise/blob/develop/src/assets/images/promo/promo-2.png?raw=true)

![ZparkWise Promo Image](https://github.com/CellectIO/ZparkWise/blob/develop/src/assets/images/promo/promo-3.png?raw=true)

---

## Development Setup

---

### Prerequisites

This project was generated with Angular CLI version 17.1.2.

Ensure you have the following installed:

- Node.js
- Angular CLI

---

### Installation
1. Clone the repository

2. Open command prompt and navigate to the cloned repository

```bash
cd ZparkWise
```

3. Once inside the target repository folder install all the required dependencies using the following NPM command.

```bash
npm install
```

---

### Serving / Running the Application

Once you have completed the installation guide above we are ready to run the development server with:

```bash
ng serve
```

Navigate to the following url:

```bash
http://localhost:4200/
```

The application will automatically reload if you change any of the source files.

---

### Building the Application to test in Chrome

1. Open Command Prompt in the cloned repository folder and run the following command

```bash
ng build
```

Use the following flag for a production build.

> **--configuration production**

(When using this flag the environment variables will be set to production to simulate what the application will run like for end users)

**The build artifacts will be stored in the dist/ directory.**

2. Next Open Google Chrome and go to the Extensions management page by entering the following in the address bar.

```bash
chrome://extensions/
```

If you have not done so already you will need to enable Developer Mode.

> In the top right corner of the Extensions page, toggle the switch to enable Developer mode.

Then we should be ready to load the unpacked extension. 

3. Click the Load unpacked button that appears after enabling Developer mode. A file dialog will open. Navigate to the directory where your extension files are located and select the folder.

Once all the steps above are complete you should be able to find the unpacked extension in your installed chrome extensions shortcut in the top right corner of Chrome.

---

## Contributing
We welcome contributions to improve the ZparkWise SA Loadshedding Chrome Extension!

If you have suggestions for new features or improvements, feel free to create a pull request or open an issue.

---
