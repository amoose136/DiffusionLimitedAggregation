const express = require("express");
const app = express();
const path = require("path");
const port = 3000; // Choose a suitable port number

// Define routes and server logic here
app.use(express.static(path.join(__dirname, "/"))); // Serve static files

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/DiffusionLimitedAggregation.html"));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
