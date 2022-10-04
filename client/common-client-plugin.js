import axios from 'axios';

async function register({ registerHook, peertubeHelpers }) {
  var basePath = await peertubeHelpers.getBaseRouterRoute();
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      var accountName, channelName, videoName, instanceName, buttonText;
      let element = document.querySelector('.lightning-button')
      if (element != null) {
        element.remove();
      }
      let html = `
      <label for="message">message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br>`;
      console.log(path);
      let paths = path.split("/");
      let pageType = paths[1];
      let pageId = paths[2];
      let idParts = pageId.split("@");
      instanceName = idParts[1];
      console.log("path parsing info", pageType, pageId, idParts);
      buttonText = '<p id="satbutton">⚡️Donate⚡️</p>'
      if (pageType == "a") {
        console.log("on an account page", pageId);
        accountName = idParts[0];
        buttonText = '<p id="satbutton">⚡️Tip ' + accountName + '⚡️</p>'

      }
      if (pageType == "c") {
        console.log("on a channel page", pageId);
        channelName = idParts[0]
        buttonText = '<p id="satbutton">⚡️Tip ' + channelName + '⚡️</p>'
      }
      if (pageType == "w") {
        console.log("on a video page", pageId);
        videoName = idParts[0]
        let videoData;
        try {
          videoData = await axios.get("/api/v1/videos/" + videoName);
        } catch {
          console.log("error getting data for video", videoName);
        }
        console.log(videoData.data);
        accountName = videoData.data.account.name;
        channelName = videoData.data.channel.name;
        if (location.hostname != videoData.data.account.host) {
          instanceName = videoData.data.account.host;
        }
        buttonText = '<p id="satbutton">⚡️Tip ' + accountName + '⚡️</p>'
      }
      if (pageType == "my-account") {
        console.log("on my account page");

      }
      html = html + buttonText;
      const panel = document.createElement('div');
      panel.setAttribute('class', 'lightning-button');
      panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      panel.id = pageType;
      panel.innerHTML = html;
      let timer = setInterval(async function () {
        if ((document.querySelector('.top-menu .lightning-button') === null)) {
          const topMenu = document.querySelector('.top-menu');
          console.log("topmenu", topMenu);
          if (topMenu) {
            console.log("insterting panel into topmenu", panel)
            topMenu.appendChild(panel);
          }

          document.getElementById("satbutton").onclick = async function () {
            let amount = document.getElementById('sats').value;
            let message = document.getElementById('message').value;
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

            console.log("api call for wallet info", walletApi);
            let walletData;
            try {
              walletData = await axios.get(walletApi);
            } catch {
              console.log("client unable to fetch wallet data\n", walletApi);
              peertubeHelpers.showModal({
                title: 'Unable to send tip',
                content: 'Unable to find any wallet info for ' + accountName,
                confirm: {
                  value: 'OK'
                }
              })
              return;
            }
            console.log("returned wallet data", walletData.data);
            if (walletData.data.status != 'OK') {
              console.log("server Unable to get wallet for", accountName, "\n", walletData.data);
              return;
            }
            SendSats(walletData, amount, message);
          };
          clearInterval(timer);
        } else {

        }

        /*
        if ((document.querySelector('.menu-wrapper .lightning-button') === null)) {
          const mainContent = document.querySelector('.menu-wrapper');
          console.log("maincontent", mainContent)
          if (mainContent) {
            panel.classList.add('section')
            mainContent.appendChild(panel)
            console.log("Panel added to main content", panel);
          }
        }
        */
      }, 1)
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
    await webln.enable();
    console.log("---------------\n", "webln enabled");
    //TODO properly build this

    let pubKey = walletData.data.pubkey;
    let tag = walletData.data.tag;
    let customKey = walletData.data.customData[0].customKey;
    let customValue = walletData.data.customData[0].customValue;
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
  async function boost(amount, message, from) {
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
    await webln.enable();
    console.log("---------------\n", "webln enabled");
    let api = "https://lawsplaining.peertube.biz/plugins/lightning/router/walletinfo"
    if (accountName) {
      api = api + "?account=" + accountName;
    }
    let walletData = await axios.get(api);
    console.log(walletData.data);

    let pubKey = walletData.data.pubkey;
    let tag = walletData.data.tag;
    let customKey = walletData.data.customData[0].customKey;
    let customValue = walletData.data.customData[0].customValue;
    const boost = {
      696969: customValue,
      action: "boost",
      value_msat: 1000,
      value_msat_total: 1000,
      app_name: "PeerTube",
      app_version: "1.0",
      name: "PeerTube",
      sender_name: "PeerTube",
      message: message
    };
    let paymentInfo = {
      destination: pubKey,
      amount: amount,
      customRecords: {
        7629169: boost,
        696969: customValue,
      }
    };
    console.log("payment info", paymentInfo);
    console.log("parts", paymentInfo.destination, paymentInfo.amount);
    console.log("custom records", paymentInfo.customRecords);
    await webln.keysend(paymentInfo);
  }
}
export {
  register
}
