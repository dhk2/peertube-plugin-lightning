import axios from 'axios';
async function register({ registerHook, peertubeHelpers }) {
  console.log('Hello third world');
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      const panel = document.createElement('div');
      panel.setAttribute('class', 'lightning-button');
      panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      const html = `
      <label for="message">message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br>
      <p id="satbutton" onclick="()">⚡️Send Sats⚡️</p>
      `

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
            SendSats(amount, message)
          };

        }
        if ((document.querySelector('.menu-wrapper .lightning-button') === null)) {
          const mainContent = document.querySelector('.menu-wrapper');
          console.log("maincontent", mainContent)
          if (mainContent) {
            panel.classList.add('section')
            mainContent.appendChild(panel)
            console.log("Panel added to main content", panel);
          }
        }
      }, 1)
    }
  })
  async function SendSats(amount, message) {
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
    let walletData = await axios.get("https://lawsplaining.peertube.biz/plugins/lightning/router/walletinfo");
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
    let walletData = await axios.get("https://lawsplaining.peertube.biz/plugins/lightning/router/walletinfo");
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
