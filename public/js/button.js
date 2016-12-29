/**
 * Created by Iaroslav Zhbankov on 29.12.2016.
 */
var buttons = document.querySelectorAll(".going-btn-js");
buttons.forEach(function (item, index) {
    item.addEventListener("click", function () {
        req = new XMLHttpRequest();
        var user = item.getAttribute("data-user");
        var bar = item.getAttribute("data-barname");
        var URL = "/search/" + user + "/" + bar;
        req.open("GET", URL, true);
        req.send(null);

        req.onreadystatechange = function () {
            if (req.readyState == XMLHttpRequest.DONE) {
                if (req.responseText == 'not authorised') {
                    alert("You should authorised");
                } else {
                    item.innerHTML = JSON.parse(req.responseText)["number"] + " GOING";
                }
            }
        };
    })
});


