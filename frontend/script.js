const API_URL =
    "http://127.0.0.1:8000/api/complete-analysis";


async function getAnalysis() {

    const rowId =
        document.getElementById("rowId").value;

    const loading =
        document.getElementById("loading");

    const error =
        document.getElementById("error");

    const button =
        document.getElementById("analyzeBtn");

    const buttonText =
        document.getElementById("buttonText");

    const buttonIcon =
        document.getElementById("buttonIcon");


    /* Clear previous error */

    error.textContent = "";


    /* Validate row */

    if (rowId === "" || rowId < 0) {

        error.textContent =
            "Please enter a valid dataset row ID.";

        return;
    }


    /* Loading state */

    loading.style.display = "flex";

    button.disabled = true;

    buttonText.textContent =
        "Analyzing...";

    buttonIcon.textContent =
        "◌";


    try {

        const response = await fetch(
            `${API_URL}?row_id=${rowId}`,
            {
                method: "POST"
            }
        );


        const data =
            await response.json();


        if (!response.ok ||
            data.status === "error") {

            throw new Error(
                data.message ||
                "Analysis failed."
            );
        }


        /* ============================
           Get values
        ============================ */

        const demand =
            data.forecast.forecasted_demand;

        const inventory =
            data.inventory.inventory_level;

        const currentPrice =
            data.pricing.current_price;

        const competitorPrice =
            data.pricing.competitor_price;

        const recommendedPrice =
            data.pricing.recommended_price;

        const action =
            data.pricing.action;

        const insight =
            data.ai_insight;


        /* ============================
           Animated values
        ============================ */

        animateValue(
            "demand",
            demand,
            800
        );

        animateValue(
            "inventory",
            inventory,
            800
        );

        animateValue(
            "currentPrice",
            currentPrice,
            800,
            true
        );

        animateValue(
            "competitorPrice",
            competitorPrice,
            800,
            true
        );

        animateValue(
            "recommendedPrice",
            recommendedPrice,
            1000,
            true
        );


        /* ============================
           Action
        ============================ */

        const actionElement =
            document.getElementById("action");

        actionElement.textContent =
            action.toUpperCase();

        actionElement.className =
            "action-badge";


        if (action === "Increase Price") {

            actionElement.classList.add(
                "action-increase"
            );

        } else if (
            action === "Decrease Price"
        ) {

            actionElement.classList.add(
                "action-decrease"
            );

        } else {

            actionElement.classList.add(
                "action-maintain"
            );
        }


        /* ============================
           AI Insight
        ============================ */

        typeText(
            document.getElementById("aiInsight"),
            insight
        );


        /* ============================
           Price comparison
        ============================ */

        document.getElementById(
            "visualCurrentPrice"
        ).textContent =
            "₹" + Number(currentPrice).toFixed(2);


        document.getElementById(
            "visualCompetitorPrice"
        ).textContent =
            "₹" + Number(competitorPrice).toFixed(2);


        document.getElementById(
            "visualRecommendedPrice"
        ).textContent =
            "₹" + Number(recommendedPrice).toFixed(2);


        updateBars(
            currentPrice,
            competitorPrice,
            recommendedPrice
        );


        /* Success animation */

        document
            .querySelectorAll(".metric-card")
            .forEach((card, index) => {

                card.style.animation = "none";

                setTimeout(() => {

                    card.style.animation =
                        `cardIn .6s ease ${index * 0.05}s both`;

                }, 20);

            });

    }

    catch (err) {

        console.error(err);

        error.textContent =
            "Unable to connect to PricePilot AI backend. Make sure FastAPI is running.";

    }

    finally {

        loading.style.display = "none";

        button.disabled = false;

        buttonText.textContent =
            "Analyze Now";

        buttonIcon.textContent =
            "✦";
    }
}


/* ==================================
   ANIMATED NUMBER
================================== */

function animateValue(
    elementId,
    target,
    duration,
    decimal = false
) {

    const element =
        document.getElementById(elementId);

    const start = 0;

    const startTime =
        performance.now();


    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) /
                duration,
                1
            );


        const ease =
            1 - Math.pow(
                1 - progress,
                3
            );


        const value =
            start +
            (target - start) * ease;


        if (decimal) {

            element.textContent =
                value.toFixed(2);

        } else {

            element.textContent =
                Math.round(value);
        }


        if (progress < 1) {

            requestAnimationFrame(update);

        }

    }


    requestAnimationFrame(update);
}


/* ==================================
   PRICE BARS
================================== */

function updateBars(
    current,
    competitor,
    recommended
) {

    const maximum =
        Math.max(
            current,
            competitor,
            recommended
        );


    setTimeout(() => {

        document.getElementById(
            "currentBar"
        ).style.width =
            `${(current / maximum) * 100}%`;


        document.getElementById(
            "competitorBar"
        ).style.width =
            `${(competitor / maximum) * 100}%`;


        document.getElementById(
            "recommendedBar"
        ).style.width =
            `${(recommended / maximum) * 100}%`;

    }, 200);
}


/* ==================================
   TYPING ANIMATION
================================== */

function typeText(element, text) {

    element.textContent = "";

    let index = 0;

    const speed = 8;


    function type() {

        if (index < text.length) {

            element.textContent +=
                text.charAt(index);

            index++;

            setTimeout(type, speed);

        }

    }


    type();
}


/* ==================================
   ENTER KEY
================================== */

document
    .getElementById("rowId")
    .addEventListener(
        "keypress",
        function (event) {

            if (event.key === "Enter") {

                getAnalysis();

            }

        }
    );