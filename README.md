# C Forge — Online C Compiler

C Forge is a browser-based interface for writing, testing, and running small C programs. It brings a code editor, standard input field, sample programs, and execution output into one workspace.

The browser handles the editor experience. When a program is run, C Forge submits the source code and optional standard input to the Judge0 CE API, then checks the submission until a result is available.

> **Project scope:** C Forge is a learning and development project. It relies on a hosted Judge0 service for execution; it is not a self-hosted compiler or a production-grade, multi-user code execution platform.

## Features

- **C source editor:** Edit the contents of `main.c` in the browser.
- **Line numbers and editor statistics:** The interface updates line numbers and displays the current line and character counts.
- **Standard input:** Provide input for programs that use functions such as `scanf` or `fgets`.
- **Sample programs:** Load examples for Hello World, reading input with `scanf`, summing an array, and generating a multiplication table.
- **Remote execution:** Submit source code to Judge0 CE and poll for compilation and execution results.
- **Execution feedback:** Display compiler output, standard output, standard error, the execution status, runtime, memory usage when returned, and request round-trip time.
- **Editor shortcuts:** Press `Tab` to insert four spaces, or `Ctrl + Enter` / `Cmd + Enter` to run the current program.
- **Copy and reset controls:** Copy the current source code or restore the starter example.
- **Theme preference:** Switch between light and dark themes. The selected theme is saved in browser local storage; when no saved choice exists, the system colour preference is used.
- **Responsive interface:** The editor and output panels adapt to narrower screens.

## Technology

The current application is implemented with:

- **HTML** for the page structure.
- **CSS** for layout, responsive styling, themes, and interface animations.
- **JavaScript (ES modules)** for editor interactions, state, API requests, and result handling.
- **Vite** for local development and production builds.
- **Judge0 CE API** for remote C compilation and execution.

The repository's package manifest also declares React, TypeScript, and other packages, but the current page loads `main.js` directly and the inspected application entry point uses native HTML and vanilla JavaScript. The active implementation should therefore be described as HTML/CSS/JavaScript with Vite unless the application is later migrated to React and TypeScript.

## How execution works

1. When the page loads, C Forge requests the available languages from `https://ce.judge0.com/languages/`.
2. It looks for language entries whose names begin with `C (` and selects the highest version returned. If language detection fails, it uses the fallback entry **C (GCC 9.2.0)** with language ID `50`.
3. When the user selects **Run program** or presses `Ctrl/Cmd + Enter`, the browser sends the selected language ID, source code, standard input, and execution limits to the Judge0 submissions endpoint.
4. Judge0 returns a submission token. C Forge uses that token to request the result approximately every 900 milliseconds.
5. Polling stops when Judge0 returns a completed status or when the application reaches its 25-second polling limit.
6. The interface displays the returned compiler output, standard output, standard error, message, status, and available execution metrics.

The submission request sets a CPU time limit of 2 seconds and a wall-clock time limit of 5 seconds. The exact execution environment and service availability are controlled by the remote Judge0 host.

## Getting started

### Prerequisites

- Node.js (an LTS release is recommended)
- npm
- An internet connection to reach the Judge0 CE API

### Install dependencies

Clone the repository and install its dependencies:

```bash
git clone https://github.com/Jithendra54/Online_C-compiler.git
cd Online_C-compiler
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal. The Vite configuration sets the development server to port `3000`.

### Create a production build

```bash
npm run build
```

The production files are generated in the `dist/` directory.

### Preview the production build locally

```bash
npm run preview
```

## Using C Forge

1. Open C Forge in your browser.
2. Write or edit a C program in the `main.c` editor, or select one of the sample programs.
3. Enter optional standard input in the **Program Input** panel.
4. Select **Run program** or press `Ctrl + Enter` on Windows/Linux or `Cmd + Enter` on macOS.
5. Read the result in the **Console** panel. Compiler messages and errors are shown there as well.
6. Use **Copy code** to copy the current source or **Reset** to restore the starter example.

## Repository layout

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, interface controls, and application entry point |
| `main.js` | Editor interactions, sample programs, theme preference, Judge0 requests, polling, and output rendering |
| `styles.css` | Layout, visual styling, responsive rules, themes, and animations |
| `vite.config.ts` | Vite configuration, development server settings, and deployment base path |
| `package.json` | Project metadata, scripts, and declared dependencies |
| `tsconfig.json` | TypeScript compiler configuration retained in the repository |

## Configuration and external service

C Forge currently uses the public Judge0 CE endpoint:

```text
https://ce.judge0.com
```

The endpoint is defined near the top of `main.js` as `API_ROOT`. The current implementation does not include a separate application backend or a user-managed Judge0 deployment.

The Vite configuration sets the base path to `/Online_C-compiler/` for deployment under the repository's GitHub Pages path. If you deploy the application somewhere else, review the `base` setting in `vite.config.ts`.

## Limitations and security considerations

- **External execution service:** Source code and standard input are sent from the browser to the configured Judge0 host. Do not submit passwords, API keys, private data, or confidential source code.
- **Network dependency:** Compilation and execution require the browser to reach the Judge0 service. A service outage, queue delay, network problem, or host-side policy change can prevent a run from completing.
- **Polling timeout:** The interface stops checking for a result after 25 seconds and displays an error.
- **Not a production execution platform:** This project does not provide its own execution backend, account system, job queue, abuse controls, or operational monitoring. A public multi-user service would require a carefully secured execution architecture and additional controls.
- **Declared dependencies:** Some packages in `package.json` are not imported by the current application entry point. Review and remove unused dependencies, or migrate the implementation deliberately before describing them as technologies used by the application.

## Troubleshooting

**The runtime badge shows a fallback.**  
C Forge could not retrieve the language list from Judge0. Check the internet connection and whether the configured service is reachable. The application will use its fallback C language entry.

**The console reports that the Judge0 host requires authentication.**  
The current public endpoint may have changed its access policy. Use an appropriately configured Judge0 instance and update `API_ROOT` in `main.js`. Do not put private service credentials in browser-side code.

**A program expects input but does not behave as expected.**  
Enter the required values in the **Program Input** panel before running the program.

**A run takes too long.**  
The application polls for up to 25 seconds. A busy remote queue or an unavailable service can prevent a result from arriving within that period.

## Author

**Jithendra Vishnu**  
B.Tech, Computer Science and Engineering — Central University of Jammu

- GitHub: [Jithendra54](https://github.com/Jithendra54)
- LinkedIn: [Jithendra Vishnu](https://www.linkedin.com/in/jithendra-vishnu-a48143313/)

---

C Forge is a personal software project developed to explore the browser-based programming workflow and integration with a remote code-execution API.
