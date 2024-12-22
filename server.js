const express = require('express');
const path = require('path');
const app = express();
const PORT = 8989;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html")); // Correct path to index.html
});

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
