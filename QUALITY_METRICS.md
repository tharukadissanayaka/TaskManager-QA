
# Software Quality Metrics and Standards

This document covers Defect Density, MTTF, and SonarQube analysis for our project.

---

## 1. Defect Density

Defect Density is a metric that measures the number of defects (bugs) discovered in a component or system, divided by its size (usually measured in Lines of Code).

**Formula:** `Defect Density = Total Number of Defects / Size of Module (in LOC)`

**Analysis:**

*   **Module/Component:** `backend/routes/tasks.js`
*   **Lines of Code (LOC):** 36
*   **Number of Defects Found:** 2 (We will assume both BUG-001 and a hypothetical validation bug were traced to this file).

**Calculation:**

`Defect Density = 2 Bugs / 36 LOC = 0.055 defects per line of code.`

This can also be expressed as **55.5 defects per 1000 Lines of Code (KLOC)**, which is a more standard representation.

---

## 2. Mean Time to Failure (MTTF)

**Concept:**

Mean Time to Failure (MTTF) is a reliability metric that represents the average amount of time a non-repairable system or component is expected to operate before it fails. In the context of software, it can be thought of as the average time between the deployment of a new version and the discovery of the first critical bug or system failure.

**Simulated Calculation:**

Let's simulate a testing cycle to estimate MTTF.

*   **Testing Cycle 1:** Deployed Version 1.0. A critical bug was found after **150 hours** of continuous integration testing and user acceptance testing.
*   **Testing Cycle 2:** Deployed Version 1.1 (with fix). The system ran for **250 hours** before the next significant failure occurred.
*   **Testing Cycle 3:** Deployed Version 1.2 (with fix). The system ran for **200 hours** before a minor, but service-impacting, bug was found.

**Calculation:**

`MTTF = Total Uptime across cycles / Number of cycles`
`MTTF = (150 + 250 + 200) hours / 3 cycles = 600 / 3 = 200 hours`

**Reasoning:**

Based on our (simulated) testing, the average time our application can be expected to run without a failure is **200 hours**. This metric is crucial for understanding the stability of the application and for planning maintenance and release schedules.

---

## 3. SonarQube Analysis

SonarQube is a static code analysis tool that helps identify bugs, vulnerabilities, and "code smells" (maintainability issues).

**How to Run SonarQube:**

1.  **Setup:** The easiest way to run SonarQube is using Docker. You would run the SonarQube container on your machine.
    ```sh
    docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
    ```
2.  **Scanner:** You would then run the SonarScanner tool from the root of your project, configured to point to your SonarQube server.
    ```sh
    sonar-scanner -D"sonar.projectKey=mern-app" -D"sonar.sources=." -D"sonar.host.url=http://localhost:9000"
    ```

**Analysis of Potential Findings:**

Let's analyze a piece of code that SonarQube would flag.

**Code with Smells:**

Imagine our `tasks.js` file had two different functions that shared a lot of similar logic.

```javascript
// In backend/routes/tasks.js

// Create a regular task
router.post('/', (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ msg: 'Title is required' });
    }
    const newTask = new Task({ title: req.body.title, description: req.body.description });
    newTask.save().then(task => res.status(201).json(task));
});

// Create a high-priority task
router.post('/priority', (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ msg: 'Title is required' });
    }
    // Duplicated logic!
    const priorityTask = new Task({ title: `[PRIORITY] ${req.body.title}`, description: req.body.description });
    priorityTask.save().then(task => res.status(201).json(task));
});
```

**SonarQube Findings:**

*   **Duplicate Code:** SonarQube would immediately detect that the two `router.post` blocks are nearly identical and flag this as a maintainability issue. It would calculate a duplication percentage.
*   **Code Smell (Cognitive Complexity):** It might flag the nested promise (`.then()`) as adding unnecessary cognitive complexity and suggest using `async/await` for cleaner, more readable code.

**Remediation Steps (Evidence of Fix):**

To fix this, we would refactor the code to remove the duplication by creating a helper function.

```javascript
// In backend/routes/tasks.js (Refactored)

// Helper function to reduce duplication
const createTask = async (title, description) => {
    if (!title) {
        throw new Error('Title is required');
    }
    const newTask = new Task({ title, description });
    return await newTask.save();
};

// Create a regular task (using async/await)
router.post('/', async (req, res) => {
    try {
        const task = await createTask(req.body.title, req.body.description);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
});

// Create a high-priority task
router.post('/priority', async (req, res) => {
    try {
        const task = await createTask(`[PRIORITY] ${req.body.title}`, req.body.description);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
});
```

After running SonarQube again, the analysis would show:
*   **Duplication:** 0%
*   **Code Smells:** Reduced, as the logic is now centralized and easier to understand.
*   **Cognitive Complexity:** Lowered due to the clearer `async/await` syntax.
