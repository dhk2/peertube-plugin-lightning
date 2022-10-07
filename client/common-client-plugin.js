import axios from 'axios';

async function register({ registerHook, peertubeHelpers }) {
  var basePath = await peertubeHelpers.getBaseRouterRoute();
  var menuTimer, streamTimer, streamEnabled, wallet, streamAmount, currentTime, userName;
  streamAmount = 10;
  userName = "anon";

  registerHook({
    target: 'action:auth-user.information-loaded',
    handler: async ({ user }) => {
      userName = user.account.displayName;
    }
  })
  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: async ({ player, video }) => {
      let videoEl = player.el().getElementsByTagName('video')[0]
      console.log("adding player info hopefully", video.account, video.channel);
      let instanceName;
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      let accountName = video.byAccount;
      let channelName = video.byVideoChannel;
      let videoName = video.uuid;
      let walletData = await getWalletInfo(videoName, accountName, channelName, instanceName)
      if (walletData) {
        console.log(walletData);
        let lastStream = 0;
        let delta = 0;
        lastStream = videoEl.currentTime;
        streamTimer = setInterval(async function () {
          currentTime = videoEl.currentTime;
          delta = currentTime - lastStream;
          console.log(delta);
          if (delta < 61 && delta > 59) {
            console.log("time to pay piggie", delta, walletData);
            boost(walletData, streamAmount, null, userName, video.channel.displayName, video.name, "stream");
            lastStream = currentTime;
          }
          if (delta > 62 || delta < 0) {
            console.log("probably scrubbed, resetting stream clock");
            lastStream = currentTime;
          }
        }, 1000);
      }
    }
  })


  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      clearInterval(menuTimer);
      var accountName, channelName, videoName, instanceName, buttonText, button;
      let element = document.querySelector('.lightning-button')
      if (element != null) {
        element.remove();
      }




      let html = `
      <br><div _ngcontent-cav-c133="" class="lighting-buttons-block ng-star-inserted">
       <p _ngcontent-cav-c133="" display:none id = "boostagram" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="Boostagram">boostagram</p>
        </div>
        <div id="satdialog">
      <form><label for="from">From:</label><br>
      <input type="text" id="from" name="from" value="`+ userName + `" autocomplete="on" maxLength="28"><br>
      <label for="message">Message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br><br></form>
      `;
      console.log(path);
      let paths = (path + "/").split("/");
      let pageType = paths[1];
      let pageId = paths[2];
      let idParts = pageId.split("@");
      instanceName = idParts[1];
      console.log(instanceName);
      console.log("path parsing info", pageType, pageId, idParts);
      buttonText = '⚡️Donate to ' + location.hostname + '⚡️';
      if (pageType == "a") {
        console.log("on an account page", pageId);
        accountName = idParts[0];
        buttonText = '⚡️Boost ' + accountName + '⚡️'

      }
      if (pageType == "c") {
        console.log("on a channel page", pageId);
        channelName = idParts[0]
        buttonText = '⚡️Boost' + channelName + '⚡️'
      }
      let videoData;
      if (pageType == "w") {
        console.log("on a video page", pageId);
        videoName = idParts[0]
        try {
          videoData = await axios.get("/api/v1/videos/" + videoName);
        } catch {
          console.log("error getting data for video", videoName);
        }
        //console.log(videoData.data);
        accountName = videoData.data.account.name;
        channelName = videoData.data.channel.name;
        if (location.hostname != videoData.data.account.host) {
          instanceName = videoData.data.account.host;
        }
        buttonText = '⚡️Boost ' + accountName + '⚡️';
      }
      if (pageType == "my-account") {
        console.log("on my account page");
        //TODO add dialog to manually set address or pubkey info
      }
      let walletData = await getWalletInfo(videoName, accountName, channelName, instanceName);
      if (walletData) {
        if (walletData.status != 'OK') {
          console.log("server Unable to get wallet for", accountName, "\n", walletData.data);
          return;
        }
        button = ` 
        <div _ngcontent-cav-c133="" class="lighting-buttons-block ng-star-inserted">
        <p id = "satbutton" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="satbutton">`+ buttonText + `</p>
        </div>
        `

        html = html + button + '</div>';
        const panel = document.createElement('div');
        panel.setAttribute('class', 'lightning-button');
        panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        panel.id = pageType;
        panel.innerHTML = html;
        menuTimer = setInterval(async function () {
          if ((document.querySelector('.top-menu .lightning-button') === null)) {
            const topMenu = document.querySelector('.top-menu');
            console.log("topmenu", topMenu);
            if (topMenu) {
              console.log("insterting panel into topmenu", panel)
              topMenu.appendChild(panel);

              let dialogElement = document.getElementById("satdialog");
              dialogElement.style.display = "none"
              console.log(dialogElement);
              document.getElementById("boostagram").onclick = async function () {
                console.log(dialogElement.style);
                if (dialogElement.style.display !== "none") {
                  dialogElement.style.display = "none";
                } else {
                  dialogElement.style.display = "block";
                }
              };
              document.getElementById("boostagram").style.display = "block";
              document.getElementById("satbutton").onclick = async function () {
                let amount = document.getElementById('sats').value;
                let message = document.getElementById('message').value;
                let from = document.getElementById('from').value;
                let displayName, episode;
                if (videoData) {
                  displayName = videoData.data.channel.displayName;
                  episode = videoData.data.name;
                }
                boost(walletData, amount, message, from, displayName, episode, "boost");
              };
            }
          }
        }, 1);
      }
    }
  })
  async function SendSats(walletData, amount, message, name) {
    if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    console.log("parsint", parseInt(amount));
    if (parseInt(amount) < 1) {
      amount = "69";
    }
    try {
      let supported = await webln.enable();
    } catch {
      peertubeHelpers.showModal({
        title: 'No WebLN provider found',
        content: `<p>You can get the Alby plug in for most popular browsers<p>
           https://getalby.com/ There are several other options availabel as well<p>
           https://webln.dev/#/
          if you don't have a lightnign wallet there are many to choose from.
          The alby wallets have high compatibility and aren't just for podcasters any more
          https://getalby.com/podcast-wallet`,
        close: true,
        confirm: { value: 'confirm', action: () => { } },
      })
      return
    }
    console.log("---------------\n", "webln enabled");
    //TODO properly build this

    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKey = walletData.customData[0].customKey;
    let customValue = walletData.customData[0].customValue;
    let paymentInfo = {
      destination: pubKey,
      amount: amount,
      customRecords: {
        "34349334": message,
        "696969": customValue,
      }
    }


    console.log("payment info", paymentInfo);
    console.log("parts", paymentInfo.destination, paymentInfo.amount);
    console.log("custom records", paymentInfo.customRecords);
    await webln.keysend(paymentInfo);
  }
  async function boost(walletData, amount, message, from, channel, episode, type) {
    try {
      let supported = await webln.enable();
    } catch {
      peertubeHelpers.showModal({
        title: 'No WebLN provider found',
        content: `<p>You can get the <a href ="https://getalby.com/">Alby plug in</a> for most popular browsers<p>
           There are <a href= "https://webln.dev/#/">Several other options</a> for using WebLN available as well<p>
          if you don't have a lightnign wallet there are many to choose from.
          The <a href = "https://getalby.com/podcast-wallet">alby wallets</a> have high compatibility and aren't just for podcasters any more
          `,
        close: true,
        confirm: { value: 'confirm', action: () => { return } },
      })
    }
    console.log("boosting", walletData, amount, message, from, channel, episode);
    if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    console.log("parsint", parseInt(amount));
    if (parseInt(amount) < 1) {
      amount = "69";
    }
    if (!from) {
      from = "Anon";
    }
    if (from != userName) {
      userName = from;
    }
    if (!type) {
      type = "boost";
    }
    console.log("parameters normalized");
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKey, customValue
    if (walletData.customData) {
      customKey = walletData.customData[0].customKey;
      customValue = walletData.customData[0].customValue;
    }
    console.log("wallet variables set");
    const boost = {
      action: type,
      value_msat: amount * 1000,
      value_msat_total: amount * 1000,
      app_name: "PeerTube",
      app_version: "1.0",
      name: "PeerTube",
      sender_name: from,
      message: message,
      ts: currentTime.toFixed()
    };
    console.log(boost);
    console.log("basic boost created");
    if (channel) {
      boost.podcast = channel;
    }
    if (episode) {
      boost.episode = episode;
    }

    let paymentInfo;
    console.log("video boost updated");
    if (customValue) {
      paymentInfo = {
        destination: pubKey,
        amount: amount,
        customRecords: {
          7629169: JSON.stringify(boost),
          "696969": customValue,
        }
      };
    } else {
      paymentInfo = {
        destination: pubKey,
        amount: amount,
        customRecords: {
          7629169: JSON.stringify(boost),
        }
      };
    }
    console.log("payment info", paymentInfo);
    //console.log("settings", await peertubeHelpers.getSettings());
    //console.log("parts", paymentInfo.destination, paymentInfo.amount);
    //console.log("custom records", paymentInfo.customRecords);
    await webln.keysend(paymentInfo);
  }

  async function getWalletInfo(videoName, accountName, channelName, instanceName) {
    console.log(videoName, accountName, channelName, instanceName);
    let walletApi = basePath + "/walletinfo";
    if (videoName) {
      if (instanceName) {
        walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "@" + instanceName + "&channel=" + channelName + "@" + instanceName;
      } else {
        walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "&channel=" + channelName;
      }
    } else {
      if (accountName) {
        walletApi = walletApi + "?account=" + accountName;
      }
      if (channelName) {
        walletApi = walletApi + "?channel=" + channelName;
      }
      if (instanceName) {
        walletApi = walletApi + "@" + instanceName;
      }
    }
    console.log("api call for video wallet info", walletApi);
    let walletData;
    try {
      walletData = await axios.get(walletApi);
    } catch {
      console.log("client unable to fetch wallet data\n", walletApi);
      return;
    }
    console.log("returned wallet data", walletData.data);
    if (walletData.data.status != 'OK') {
      console.log("server Unable to get wallet for", accountName, "\n", walletData.data);
      return;
    }
    return walletData.data;
  }
}
export {
  register
}
