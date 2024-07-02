# ShedWise Chrome Extension
A Reactive Chrome Extension built on top of the ESP API

## Disclaimer:
This Chrome extension is not affiliated with or endorsed by the creators of EskomSePush (ESP). Use at your own discretion.

## Project Overview
The ShedWise Chrome Extension is designed to visualize the publicly available Eskom Se Push (ESP) API. This extension provides users with a convenient way to access and interpret data regarding electricity load shedding schedules in South Africa. Built using Angular, this extension offers a seamless and reactive user experience.

## Features
- Access the latest information on load shedding schedules.
- A simplistic design similar to the mobile application for easy navigation and data interpretation.
- Cache configuration to save on API call count (if you are using a free account)

## Development Setup

### Prerequisites

This project was generated with Angular CLI version 17.1.2.

Ensure you have the following installed:

- Node.js
- Angular CLI


### Installation
Clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/CellectIO/ESPLoadsheddingExtension.git
```

Open command prompt and navigate the the cloned repository

```bash
cd ESPLoadsheddingExtension
```

Once inside the target repository folder install all the required dependencies using the following NPM command.

```bash
npm install
```

### Serving / Running the Application

Once you have completed the installation guide above we are ready to run the development server with:

```bash
ng serve
```

Navigate to http://localhost:4200/. The application will automatically reload if you change any of the source files.

### Building the Application to test in Chrome

Open Command Prompt in the cloned repository folder and run the following command

```bash
ng build
```

The build artifacts will be stored in the dist/ directory. Use the (--configuration production) flag for a production build.

Next Open Google Chrome. Go to the Extensions management page by entering chrome://extensions/ in the address bar.

If you have not done so already you will need to enable Developer Mode. In the top right corner of the Extensions page, toggle the switch to enable Developer mode.

Then we should be ready to load the unpacked extension. Click the Load unpacked button that appears after enabling Developer mode. A file dialog will open. Navigate to the directory where your extension files are located and select the folder.

Once all the steps above are complete you should be able to find the unpacked extension in your installed chrome extensions shortcut in the top right corner of Chrome.

## Contributing
We welcome contributions to improve the ShedWise Chrome Extension! 
If you have suggestions for new features or improvements, feel free to create a pull request or open an issue.

### Steps to Contribute
- Fork the repository.
- Create a new branch (git checkout -b feature/YourFeature develop -t).
- Commit your changes (git commit -m 'Add some feature').
- Push to the branch (git push origin feature/YourFeature).
- Open a pull request :).

## License
This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the LICENSE file for details.