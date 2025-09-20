
# Bug Reports & Root Cause Analysis

This file contains the details for two bugs found during testing, ready to be logged in a tracking tool like Jira or Bugzilla.

---

## Bug 1: Data Loss on Task Creation with Invalid Description

*   **ID:** BUG-001
*   **Severity:** Major
*   **Summary:** The application does not create a task if the description is a non-string value (e.g., a number), and it provides no feedback to the user.
*   **Component:** backend-api

**Steps to Reproduce:**

1.  Use an API client (like Postman) or the application UI if it were to allow it.
2.  Send a `POST` request to `/api/tasks`.
3.  Set the `Content-Type` header to `application/json`.
4.  Provide the following JSON payload:
    ```json
    {
        "title": "A valid title",
        "description": 12345
    }
    ```
5.  Observe the server's response.

**Expected Result:**

The API should either:
1.  Successfully create the task by coercing the description to a string ("12345").
2.  Return a `400 Bad Request` error indicating that the `description` field must be a string.

**Actual Result:**

The server hangs for a period and then returns a generic `500 Internal Server Error`. The task is not created, and the user is not informed of the specific reason for the failure.

---

## Bug 2: UI Does Not Clear Error Message After Correction

*   **ID:** BUG-002
*   **Severity:** Minor
*   **Summary:** In the web UI, if a user triggers the "Title is required" error, the error message persists on the screen even after the user has corrected the error and successfully submitted a task.
*   **Component:** frontend-ui

**Steps to Reproduce:**

1.  Open the Task Manager application in a web browser.
2.  Leave the "Task Title" input field empty.
3.  Click the "Add Task" button.
4.  **Observe:** The error message "Title is required" appears correctly.
5.  Now, type a valid title (e.g., "My New Task") into the "Task Title" input field.
6.  Click the "Add Task" button again.

**Expected Result:**

The new task should be added to the list, and the error message "Title is required" should disappear.

**Actual Result:**

The new task is added to the list correctly, but the error message "Title is required" remains visible on the screen, causing confusion.

---

## Root Cause Analysis for BUG-001

**1. Why did it happen?**

The bug occurred because of how the Mongoose schema and the Express route handler interact. The `Task` schema defines the `description` field as a `String`. When the route handler receives a request where the `description` is a number (`12345`), Mongoose attempts to cast this number to a String. In this specific version of the library or its dependencies, this casting process is failing silently and causing an unhandled promise rejection within the `.save()` method. The `.catch()` block in our route handler is generic and simply returns a `500` error without inspecting the actual error object from Mongoose, which would have indicated a CastError.

**2. How was it fixed?**

The fix involves adding more specific error handling in the route. Instead of a generic catch-all, the code should inspect the error type. If it's a `CastError` or `ValidationError` from Mongoose, the server should respond with a `400 Bad Request` and a meaningful error message. This informs the client what they did wrong.

**Fixed Code Snippet:**

```javascript
// In backend/routes/tasks.js
router.post('/', (req, res) => {
    // ... (title validation remains the same)

    const newTask = new Task({
        title: req.body.title,
        description: req.body.description
    });

    newTask.save()
        .then(task => res.status(201).json(task))
        .catch(err => {
            // Specific error handling
            if (err.name === 'ValidationError' || err.name === 'CastError') {
                return res.status(400).json({ error: `Invalid data: ${err.message}` });
            }
            // Generic error for other cases
            res.status(500).json({ error: 'Server error' });
        });
});
```

**3. How to prevent similar bugs in the future?**

*   **Defensive Programming:** Always assume client data can be incorrect or malicious. All API endpoints that accept data should have robust validation and specific error handling for different failure modes.
*   **Code Reviews:** During code reviews, pay special attention to `try...catch` blocks. Ensure that error handling is not overly generic and that it returns meaningful status codes and messages to the client.
*   **Integration Testing:** Expand the integration test suite to include negative test cases with deliberately malformed data (e.g., wrong data types, extra fields, missing fields) for every endpoint.
