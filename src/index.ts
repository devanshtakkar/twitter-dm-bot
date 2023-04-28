import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol, ElementHandle } from "puppeteer";
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import config from "./config";
puppeteer.use(StealthPlugin());
const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
];

const options = {
    ...args,
    headless: false,
};
async function main() {
    const browser = await puppeteer.launch(options);
    let cookies = await readFile("cookies.json", {
        encoding: "utf8",
    });
    let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
    let page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 720 });
    await page.setCookie(...cookieJson);

    // open the search page
    await page.goto(
        `https://twitter.com/search?q=${config.searchQuery}&src=recent_search_click&f=live`
    );
    await page.waitForNetworkIdle();

    //create an async iterator object to iterate over the page to find links
    let asycPageIteratorObj = {
        [Symbol.asyncIterator]: function () {
            return {
                async next() {
                    let profileLinkFinderScriptResult = await page.evaluate(
                        () => {
                            let lastLinkElemPos = Number(
                                localStorage.getItem("lastLinkElemPos")
                            );
                            console.log(lastLinkElemPos);
                            let newProfileLinks: string[] = [];
                            let profilePageLinkRegEx = /^\/[0-9A-Za-z]+$/;
                            let allElementsWithLinks =
                                document.querySelectorAll("div[data-testid='primaryColumn'] a[role='link']");
                            allElementsWithLinks.forEach((elem, index) => {
                                let profileLink = elem.getAttribute("href");
                                if (profileLink?.match(profilePageLinkRegEx)) {
                                    if (
                                        !(
                                            profileLink == "/home" ||
                                            profileLink == "/explore" ||
                                            profileLink == "/notifications" ||
                                            profileLink == "/messages"
                                        )
                                    ) {
                                        newProfileLinks.push(
                                            "https://twitter.com" + profileLink
                                        );
                                    }
                                }
                            });
                            allElementsWithLinks[
                                allElementsWithLinks.length - 1
                            ].scrollIntoView();
                            return newProfileLinks;
                        }
                    );
                    return {
                        done: false,
                        value: profileLinkFinderScriptResult,
                    };
                },
            };
        },
    };
    let visitedUrls: Set<string> = new Set();
    for await (let profileLinks of asycPageIteratorObj) {
        let profileLinksSet: Set<string> = new Set(profileLinks);
        console.log(profileLinksSet)
        innerloop: for (let link of profileLinksSet) {
            // Continue the loop is the url is already visited in the current run
            if(visitedUrls.has(link)){
                continue;
            }

            //Open the profile page in new tab
            let profilePage = await browser.newPage();
            await profilePage.goto(link);
            
            // Add the link into the visited urls Set to prevent it from opening again and again
            visitedUrls.add(link);
            try {
                let msgBtn = await profilePage.waitForSelector(
                    "div[data-testid='sendDMFromProfile']",
                    {
                        timeout: 5000,
                    }
                );
                await msgBtn!.click();
                let msgPage = await browser.newPage();
                await msgPage.goto(profilePage.url());
                try {
                    let elem = await msgPage.waitForSelector(
                        `div[data-testid='DmScrollerContainer'] >>> span ::-p-text(${config.message})`,
                        {
                            timeout: 10000,
                        }
                    );
                    msgPage.close().then(() => {
                        profilePage.close()
                    })
                    continue innerloop;
                } catch (err) {
                    console.log(err)
                }
                let msgBox = await msgPage.waitForSelector(
                    "div.public-DraftStyleDefault-block",
                    {
                        timeout: 5000,
                    }
                );
                await msgBox?.click();
                await msgBox?.type(config.message);
                let sendBtn = await msgPage.waitForSelector(
                    "div[data-testid='dmComposerSendButton']"
                );
                await sendBtn?.click();
                console.log("Message sent");
                msgPage.waitForNetworkIdle().then(async () => {
                    /* 
                    Check for the rate limitation message, and only proceed further if the rate limitation
                    is not reached otherwise pause the script for 15 minutes
                    */
                   try{
                    let errMsgElem = await msgPage.waitForSelector(`div[data-testid='DmScrollerContainer'] >>> span ::-p-text(Message failed to send)`,{
                        timeout: 2000
                    });
                    await new Promise((resolve) => {
                        console.log("Script paused for 15 minutes")
                        setTimeout(() => resolve(true), 1000 * 15 * 60);
                    })
                   }catch(err){

                   }finally{
                    await msgPage.close();
                    await profilePage.close();
                   }
                });
            } catch (error) {
                await profilePage.close();
                console.log(error);
            }
        }

        await page.waitForNetworkIdle();
    }
}

main();
