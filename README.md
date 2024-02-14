# Twitter DM bot
Automate the sending of direct messages to the people on one twitter's search page with few easy commands. This bot is written in TypeScript and makes uses of the Puppeteer to automate the Chromium browser.
## Features 
- Automates the sending of messages to profiles on Twitter's search page (Top, Latest, People etc.)
- Does not require access or payment to any twitter APIs. It uses the normal normal session cookies and automates the manual workflow of sending DMs.
- Cross-platform (Windows, Linux and MacOS)
- Checks whether the same message is already sent to the profile once to prevent the spam alarm from triggering.
- Pauses the script when the rate limit is put on the account for continuous messaging in short span.
## Limitations 
- Can only send messages to the people who have allowed the messages outside of just followers and their following.
- Due to twitters update you will now need a twitter plus subscription to send messages to people who have the option to receive DMs from unknown people disabled.
## How to use
### Setting up the application
1. Export your Twitter cookies using this extension.
2. Install [Nodejs](https://nodejs.org/en/download) for your system.
3. Download this repository and extract it if required.
4. Open the downloaded folder inside the terminal (CMD or PowerShell in Windows) and type the command ```npm install```. This will start downloading the required libraries.
### Copying twitter account cookies
1. login into your twitter account in the browser.
2. Download the cookie editor extension. (For Microsoft Edge and Chrome: [Cookie-Editor](https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi))
3. Create a new file in the root directory of the application and name it _cookies.json_ and paste the copied cookies in it.

>Pay attention to the _.json_ extension part. It is important.

>depending on the extension you may use for copying the Twitter session cookies you might need to change _**null**_ to _**unspecified**_ while saving it as a json file.
### Configuration
1. In the _src_ directory open the _config.ts_ file.
2.  Change the config parameters. 
```typescript
let config: Config = {
    searchQuery: "vancouver" //change this to hashtag or search query you would like
    message: "Enter Your Message Here!"
}
```
|  Parameter|  What it does|
|--|--|
|  searchQuery|  Explore page's search query to search the posts by users|
|message|Message you wan to send|
### Running the program
1. Open the terminal and type ```npm start```

Kachow! it will now start sending the message to people it finds according to the search query set by you.
