import axios from 'axios';
async function register({ registerHook, peertubeHelpers }) {
  console.log('Hello third world');
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      let element = document.querySelector('.lightning-button')
      if (element != null) {
        element.remove();
      }
      console.log(path);
      let paths = path.split("/");
      let pageType = paths[1];
      let pageId = paths[2];
      var buttonText = "";
      var accountName =undefined;
      console.log(pageType, pageId);
      buttonText = '<p id="satbutton">⚡️Send Sats⚡️</p>'
      if (pageType == "a") {
        console.log("on an account page", pageId);
        buttonText = '<p id="satbutton">⚡️Tip ' + pageId + '⚡️</p>'
        accountName = pageId;
      }
      if (pageType == "c") {
        console.log("on a channel page", pageId);
        //let channelData=axios.get()
      }
      if (pageType == "w") {
        console.log("on a video page", pageId);

      }
      if (pageType == "my-account") {
        console.log("on my account page");

      }
      const panel = document.createElement('div');
      panel.setAttribute('class', 'lightning-button');
      panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      const html = `
      <label for="message">message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br>
      `+ buttonText;
      panel.id = pageType;
      panel.innerHTML = html;
      setInterval(async function () {
        if ((document.querySelector('.top-menu .lightning-button') === null)) {
          const topMenu = document.querySelector('.top-menu');
          console.log("topmenu", topMenu);
          if (topMenu) {
            console.log("insterting panel into topmenu", panel)
            topMenu.appendChild(panel);
          }

          document.getElementById("satbutton").onclick = function () {
            let amount = document.getElementById('sats').value
            let message = document.getElementById('message').value
            SendSats(amount, message, accountName)
          };

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
  async function SendSats(amount, message, accountName) {
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
    let api = "https://lawsplaining.peertube.biz/plugins/lightning/router/walletinfo"
    if (accountName){
      api=api+"?account="+accountName;
    }
    let walletData = await axios.get(api);
    console.log(walletData.data);

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
    if (accountName){
      api=api+"?account="+accountName;
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
