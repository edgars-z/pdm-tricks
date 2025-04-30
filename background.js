chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url.includes("DISP_ART_NO=")) {
        const urlParams = new URL(tab.url).searchParams;
        const dispArtNo = urlParams.get("DISP_ART_NO");
        const searchType = urlParams.get("SEARCH_TYPE");

        if (dispArtNo) {
            copyToClipboard(tabId, dispArtNo);
			setTimeout(() => {
                chrome.tabs.remove(tabId); // Close the tab
            }, 500);
            if (searchType == "M3"){
                openSearchPage(dispArtNo, 1);
            }
            else {
                openSearchPage(dispArtNo, 0);
            }
            
        }
    }
});




function copyToClipboard(tabId, text) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (text) => {
            navigator.clipboard.writeText(text).then(() => {
                console.log("✅ Copied:", text);
            }).catch(err => {
                console.error("Clipboard write failed:", err);
            });
        },
        args: [text]
    });
}

function openSearchPage(searchValue, searchTarget) {
    console.log("Opening tab");
    if (searchTarget == 1){
        searchURL = "https://mingle-portal.eu1.inforcloudsuite.com/v2/AXRDNDZQ48CVDSHX_PRD/58f1c364-f675-4e1f-aae9-54b9f27933ac?favoriteContext=bookmark?MMS001%26fieldNames=W1OBKV%252C" +
            searchValue + "%26tableName=MITMAS%26keys=MMCONO%252C1%252CMMITNO%252C" +
            searchValue + "%26name=MMS001%252FB%26description=MMS001%2520Item.%2520Open%26includeStartPanel=True%26source=MForms%26requirePanel=True%26startPanel=B%26sortingOrder=1%26view=STD01-02&LogicalId=lid://infor.m3.m3";
    }
    else {
        searchURL ="http://pdmapp.plockmatic.local/Windchill/app/"
    }

	chrome.tabs.create({ url: searchURL }).then(tab => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            console.log("Tab opened");
			if (tabId === tab.id && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                if (searchTarget == 0){
                    injectSearchScript(tabId, searchValue);
                }
            }
        });
    });
}

function injectSearchScript(tabId, searchValue) {
    console.log("🔧 Injecting script into tab...");
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (value) => {
            console.log("🔎 Injected script running...");
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
        console.error("Script injection error:", err);
    });
}