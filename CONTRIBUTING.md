# Contributing to Game Center

First off, thank you for considering contributing to Game Center! It's people like you that make this project great. Every contribution is valuable.

## Running a Local Build

Here is a quick guide on how to run the Game Center repo locally so you can start contributing to the project.

**Prerequisites:**
- Node.js (v18 or higher)
- npm

**1. Fork this repository:**
Fork this repository by clicking on the `Fork` button on the top right of the page.

**2. Clone your forked repository and navigate into the directory:**
```bash
git clone https://github.com/<YOUR-USERNAME>/game-center.git
cd game-center
```

**3. Install the project dependencies:**
```bash
npm install
```

**4. Run the development server:**
```bash
npm run dev
```
This will start the Next.js development server. Open http://localhost:3000 in your browser to see the app running. All changes you make to the source code will be reflected in your running app.

## 🧪 Testing and QA

Any new feature or significant change should be accompanied by testing.

#### What to test?
- **New Features**: Ensure your new feature works as expected.
- **Bug Fixes**: Add a test that specifically covers the bug to prevent regressions.
- **Edge Cases**: Consider any edge cases or potential problem areas.
- **Interactions**: Test interactions between different parts of the code.

## ✅ Making a Pull Request (PR)

Once you've implemented a new feature or fixed a bug, you can create a PR, and we will review the changes.

Before submitting a pull request, please ensure the following steps are taken:

1.  **Lint your code:** Run the linter to check for any code style issues.
    ```bash
    npm run lint
    ```
2.  **Format your code:** Ensure your code is formatted correctly.
    ```bash
    # You may need to configure a formatting script in package.json if you don't use an editor extension.
    ```
3.  **Commit your changes:** Use clear and descriptive commit messages.
4.  **Submit the PR:** Push your changes to your fork and open a pull request against the `main` branch of the original repository.

That's it! Thanks for contributing to Game Center!