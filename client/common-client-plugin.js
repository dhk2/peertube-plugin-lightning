import axios from 'axios';

async function register({ registerHook, peertubeHelpers }) {
  var basePath = await peertubeHelpers.getBaseRouterRoute();
  var menuTimer, streamTimer, streamEnabled, wallet, streamAmount, currentTime, userName;
  streamAmount = 69;
  if (userName == undefined) {
    userName = "PeerTuber";
  }
  registerHook({
    target: 'action:auth-user.information-loaded',
    handler: async ({ user }) => {
      userName = user.account.displayName;
    }
  })
  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: async ({ player, video }) => {
      if (streamTimer) {
        clearInterval(streamTimer);
      }
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
        console.log("got wallet data for adding buttons", walletData);
        const elem = document.createElement('div')
        elem.className = 'lighting-buttons-block'
        elem.innerHTML = `<a  display:none id = "boostagram" class="peertube-button orange-button ng-star-inserted" title="boostagram">⚡️Boostagram</a>
                          <a  display:none id = "stream" class="peertube-button orange-button ng-star-inserted" title="stream">⚡️Stream Sats</a>`

        document.getElementById('plugin-placeholder-player-next').appendChild(elem)
        let dialogElement = document.getElementById("satdialog");
        let streamButtonElement = document.getElementById("streamdialog");
        document.getElementById("boostagram").onclick = async function () {
          console.log(dialogElement.style);
          if (dialogElement.style.display !== "none") {
            dialogElement.style.display = "none";
          } else {
            dialogElement.style.display = "block";
          }
        };
        document.getElementById("stream").onclick = async function () {
          //console.log(streamButtonElement.style);
          if (streamButtonElement.style.display !== "none") {
            streamButtonElement.style.display = "none";
          } else {
            streamButtonElement.style.display = "block";
          }
        };
        let lastStream = 0;
        let delta = 0;
        lastStream = videoEl.currentTime;
        streamTimer = setInterval(async function () {
          if (streamEnabled) {
            currentTime = videoEl.currentTime;
            delta = (currentTime - lastStream).toFixed();
            console.log(delta);
            if (delta == 60) {
              console.log("time to pay piggie", delta, walletData);
              if (streamEnabled) {
                let currentStreamAmount = document.getElementById('streamamount');
                if (currentStreamAmount) {
                  streamAmount = parseInt(currentStreamAmount.value);
                  console.log("setting stream amount to", streamAmount);
                }
                if (walletData.keysend) {
                  boost(walletData, streamAmount, null, userName, video.channel.displayName, video.name, "stream");
                } else if (walletData.lnurl) {
                  sendSats(walletData.lnurl, amount, message, userName);
                }
              }
              lastStream = currentTime;
            }
            if (delta > 62 || delta < 0) {
              console.log("probably scrubbed, resetting stream clock");
              lastStream = currentTime;
            }
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
      /*if (element != null) {
        element.remove();
      }
*/


      console.log("creating html for left side menu", streamAmount, userName);
      let html = `
      <div id="streamdialog">
      <input type="checkbox" id="streamsats" name="streamsats" value="streamsats">
      <label>Stream Stats while viewing</label><br>
      <input type="text" id="streamamount" name="streamamount" value="`+ streamAmount + `" maxLength="7"><br>
      </div>
      <div id="satdialog">
      <form><label for="from">From:</label><br>
      <input type="text" id="from" name="from" value="`+ userName + `" autocomplete="on" maxLength="28"><br>
      <label for="message">Message:</label><br>
      <input type="text" id="message" name="message" maxLength="128"><br><br>
      <input type="text" id="sats" name="sats" maxLength="8">
      <label for="sats"> Sats</label><br><br></form>
      `;
      console.log("navigation path entered", path);
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
      console.log("finished created left menu html", html);
      let walletData = await getWalletInfo(videoName, accountName, channelName, instanceName);
      if (walletData) {
        console.log("get wallet data for creating block on left menu", walletData);
        if (!walletData.address) {
          console.log("server Unable to get wallet for", accountName, "\n", walletData);
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
            //console.log("topmenu", topMenu);
            if (topMenu) {
              console.log("insterting panel into topmenu", panel)
              topMenu.appendChild(panel);

              let dialogElement = document.getElementById("satdialog");
              dialogElement.style.display = "none"
              document.getElementById("satbutton").onclick = async function () {
                let amount = document.getElementById('sats').value;
                let message = document.getElementById('message').value;
                let from = document.getElementById('from').value;
                let displayName, episode;
                if (videoData) {
                  displayName = videoData.data.channel.displayName;
                  episode = videoData.data.name;
                }
                if (walletData.keysend) {
                  boost(walletData.keysend, amount, message, from, userName, episode, "boost");

                } else if (walletData.lnurl) {
                  sendSats(walletData.lnurl, amount, message, displayName);
                }
                document.getElementById("satdialog").style.display = "none";
                document.getElementById("message").value = "";
              };
              let dialog2Element = document.getElementById("streamdialog");
              dialog2Element.style.display = "none"
              let checker = document.getElementById("streamsats")
              checker.onclick = async function () {
                console.log(checker.checked);
                streamEnabled = checker.checked;
                let currentStreamAmount = document.getElementById('streamamount');
                if (currentStreamAmount) {
                  streamAmount = parseInt(currentStreamAmount.value);
                  console.log("setting stream amount to", streamAmount);
                }

              };
            }
          }
        }, 1);
      }
    }
  })
  async function sendSats(walletData, amount, message, from) {
    let result;
    if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    console.log("parsint", parseInt(amount));
    if (parseInt(amount) < parseInt(walletData.minSendable)) {
      await peertubeHelpers.showModal({
        title: 'boost doesnt meet minimum limit of ' + walletData.minSendable,
        content: `Would you like to raise amount to the minimum allowed?`,
        close: true,
        cancel: { value: 'cancel', action: () => { return } },
        confirm: { value: 'confirm', action: () => { amount = walletData.minSendable } },
      })
    }
    if (parseInt(amount) > parseInt(walletData.maxSendable)) {
      await peertubeHelpers.showModal({
        title: 'boost is over the minimum limit of ' + walletData.maxSendable,
        content: `Would you like to lower the amount to the minimum allowed?`,
        close: true,
        cancel: { value: 'cancel', action: () => { return } },
        confirm: { value: 'confirm', action: () => { amount = walletData.maxSendable } },
      })
    }
    try {
      let supported = await webln.enable();
      console.log("webln is supported", supported, walletData);
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
    let urlCallback = encodeURI(walletData.callback);
    let urlFrom = encodeURIComponent(from);
    let urlMessage = encodeURIComponent(message);
    let invoiceApi = basePath + "/getinvoice?callback=" + urlCallback + "&amount=" + amount + "&name=" + urlFrom + "&message=" + urlMessage;
    console.log("invoice api", invoiceApi);
    try {
      result = await axios.get(invoiceApi);
    } catch (err) {
      console.log("error getting lnurl invoice");
    }
    console.log("result.data", result.data);
    let invoice = result.data.pr;
    console.log("invoice", invoice);
    result = await window.webln.sendPayment(invoice);
    console.log(result);

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
    console.log("parameters normalized", walletData);
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
    };
    console.log(boost);
    console.log("basic boost created");
    if (currentTime) {
      boost.ts = currentTime.toFixed();
    }
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
    let result;
    try {
      result = await webln.keysend(paymentInfo);
    } catch (err) {
      console.log("error attempting to send sats", err.message);
      //console.log("full error ",err);
      //TODO add invoice dialog at this point
    }
    // document.getElementById("satbutton").style.display="none";
    console.log(result);
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
    /*
       if (walletData.data.status != 'OK') {
         console.log("server Unable to get wallet for", accountName, "\n", walletData.data);
         return;
       }
    */
    return walletData.data;
  }
}
async function alertUnsupport() {

}
export {
  register
}
