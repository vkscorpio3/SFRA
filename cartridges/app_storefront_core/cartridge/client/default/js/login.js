"use strict";

var processInclude = require("./util");

$(document).ready(function () {
    processInclude(require("./login/login"));
    processInclude(require("./login/register"));
});
