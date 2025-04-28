browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url.includes("DISP_ART_NO=")) {
        const urlParams = new URL(tab.url).searchParams;
        const dispArtNo = urlParams.get("DISP_ART_NO");

        if (dispArtNo) {
            copyToClipboard(dispArtNo);
			setTimeout(() => {
                browser.tabs.remove(tabId); // Close the tab
            }, 500);
            openSearchPage(dispArtNo);
        }
    }
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log("✅ Copied:", text);
    }).catch(err => {
        console.error("Clipboard write failed:", err);
    });
}

function openSearchPage(searchValue) {
    console.log("Opening tab");
	browser.tabs.create({ url: "http://pdmapp.plockmatic.local/Windchill/app/" }).then(tab => {
        browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            console.log("Tab opened");
			if (tabId === tab.id && changeInfo.status === "complete") {
                browser.tabs.onUpdated.removeListener(listener);
                injectSearchScript(tabId, searchValue);
            }
        });
    });
}

function injectSearchScript(tabId, searchValue) {
    console.log("🔧 Injecting script into Firefox tab...");
    browser.scripting.executeScript({
        target: { tabId: tabId },
        func: (value) => {
            console.log("🔎 Injected script running in Firefox...");
			function waitForElement(selector, callback) {
				console.log("🔍 Waiting for element:", selector);
				let elementFound = false;  // Track if the element is found

				const interval = setInterval(() => {
					const element = document.querySelector(selector);
					if (element) {
						if (!elementFound) {
							elementFound = true;
							clearInterval(interval);  // Stop the interval once the element is found
							console.log("✅ Found search field:", element);
							callback(element);
						}
					}
				}, 500);

				setTimeout(() => {
					if (!elementFound) {  // Only log if the element is not found
						clearInterval(interval);
						console.log("❌ Search field not found within timeout.");
					}
				}, 5000);
			}

            waitForElement("#gloabalSearchField", (searchField) => {
                console.log("✏️ Populating search field with:", value);
                searchField.value = value;
				searchField.focus();
                // Trigger the search
                console.log("🚀 Triggering search...");
				const searchButton = document.querySelector("#ext-gen29");
				if (searchButton) {
					searchButton.click();
					console.log("🔘 Search button clicked.");
				} else {
					console.error("❌ Search button not found.");
				}
            });
        },
        args: [searchValue]
    }).catch(err => {
        console.error("Script injection error in Firefox:", err);
    });
}