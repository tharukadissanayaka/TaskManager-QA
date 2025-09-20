
# Security Analysis and Fixes

This document outlines two potential OWASP Top 10 vulnerabilities in our application and the code changes to mitigate them.

## 1. A01:2021 - Broken Access Control

**Vulnerability:** Any authenticated user could delete any other user's task if they know the task ID. The original `DELETE` endpoint does not check for ownership.

**Demonstration:**

Let's imagine we have a `DELETE` endpoint. A malicious user (User A) could spy on the network traffic of another user (User B) to find the ID of a task belonging to User B. User A could then send a `DELETE` request with that ID to delete User B's task.

**Vulnerable Code (Hypothetical):**

```javascript
// In backend/routes/tasks.js

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private (but broken)
router.delete('/:id', (req, res) => {
    // This finds a task by its ID and deletes it, regardless of who owns it.
    Task.findById(req.params.id)
        .then(task => task.remove().then(() => res.json({ success: true })))
        .catch(err => res.status(404).json({ success: false }));
});
```

**Fix:**

To fix this, we need to associate tasks with users. First, we would update the `Task` model to include a `user` field. Then, in the `DELETE` route, we verify that the task's owner matches the currently authenticated user.

**Evidence of Fix (Code Snippet):**

```javascript
// In backend/models/Task.js - Add a user field
const TaskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Link to a User model
});

// In backend/routes/tasks.js - The fixed DELETE route

// Assume we have authentication middleware that puts the user's ID in req.user.id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Check if the user owns the task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' }); // 401 Unauthorized
        }

        await task.remove();
        res.json({ msg: 'Task removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
```

## 2. A03:2021 - Injection

**Vulnerability:** The application could be vulnerable to NoSQL injection if user input is used directly in database queries in an unsafe way.

**Demonstration:**

Imagine a search query where the user input is directly placed into a `find` query's `where` clause. A malicious user could provide a crafted JSON object in the input to manipulate the query logic.

**Vulnerable Code (Hypothetical):**

```javascript
// In backend/routes/tasks.js

// This is a contrived example. Mongoose helps prevent this, but with raw drivers it's a risk.
router.post('/search', (req, res) => {
    // DON'T DO THIS. User input is used directly in a query.
    const query = { title: req.body.title, $where: req.body.extraQuery };
    Task.find(query)
        .then(tasks => res.json(tasks));
});
```
An attacker could send `{"extraQuery": "this.owner !== 'me'"}` to see other users' tasks.

**Fix:**

The best fix is to use an Object Data Mapper (ODM) like Mongoose, which we are already using. Mongoose models provide built-in protection by sanitizing inputs and ensuring they match the schema. You should never build queries by concatenating strings or directly inserting user-controlled objects into query structures.

**Evidence of Fix (Code Snippet):**

Our existing `POST` route is already safe because it uses the Mongoose model correctly. It constructs a new `Task` object and saves it. This ensures that only the fields defined in our `TaskSchema` (`title`, `description`) are saved to the database, and they are treated as the correct data types. Any malicious properties in the request body are ignored.

```javascript
// In backend/routes/tasks.js

// This code is safe from basic NoSQL injection
router.post('/', (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ msg: 'Title is required' });
    }

    // We create a new object from our model.
    // Mongoose ensures that only `title` and `description` are used from the request body.
    const newTask = new Task({
        title: req.body.title,
        description: req.body.description
    });

    // The .save() method is safe.
    newTask.save()
        .then(task => res.status(201).json(task))
        .catch(err => res.status(500).json({ error: err.message }));
});
```
