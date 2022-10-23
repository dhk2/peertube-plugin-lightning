import axios from 'axios';
import QRious from 'qrious';
//import QRCode from 'qrcode';
//var qrcode = new QRCode("qrcode");
async function register({ registerHook, peertubeHelpers }) {
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();
  let tipVerb = "tip";
  let streamAmount = 69;
  let lastTip = 69
  let convertRate = .00019123
  let userName = "PeerTuber";
  let menuTimer, streamTimer, streamEnabled, wallet, currentTime
  peertubeHelpers.getSettings()
    .then(s => {
      tipVerb = s['lightning-tipVerb'];
      // split = s['lightning-split'];
    })

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
      let instanceName;
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      let accountName = video.byAccount;
      let channelName = video.byVideoChannel;
      let videoName = video.uuid;
      let episodeName = video.name;
      let itemID = video.id;
      let guid = video.nameWithHostForced;
      if (!guid) {
        guid = channelName + "@" + instanceName;
      }
      let episodeGuid = video.uuid;
      let displayName = video.channel.displayName;

      console.log("full tip info", channelName, displayName, episodeName, guid, episodeGuid, itemID);
      console.log("video data", video);
      let walletData = await getWalletInfo(videoName, accountName, channelName, instanceName)
      if (walletData) {
        if (!document.querySelector('.lightning-buttons-block')) {
          const elem = document.createElement('div')
          elem.className = 'lightning-buttons-block'
          elem.innerHTML = `<a  display:none id = "boostagram" class="peertube-button orange-button ng-star-inserted" title="boostagram">⚡️` + tipVerb + `</a>`
          let addSpot = document.getElementById('plugin-placeholder-player-next');
          addSpot.appendChild(elem)
          document.getElementById("boostagram").onclick = async function () {
            await peertubeHelpers.showModal({
              title: 'Support ' + channelName,
              content: ` `,
              close: true,
              confirm: { value: 'close', action: () => { } },
            })
            await makeTipDialog(displayName);
            let tipButton = document.getElementById('modal-satbutton');
            if (tipButton) {
              tipButton.onclick = async function () {

                walletData = await buildTip(walletData, channelName, displayName, episodeName, guid, episodeGuid, itemID);
              }
            }
          };
          let delta = 0;
          let lastStream = videoEl.currentTime;
          streamTimer = setInterval(async function () {
            currentTime = videoEl.currentTime;
            if (streamEnabled) {
              delta = (currentTime - lastStream).toFixed();
              console.log(delta);
              if (delta > 60 && delta < 64) {
                if (walletData.keysend) {
                  boost(walletData.keysend, streamAmount, null, userName, video.channel.displayName, video.name, "stream", video.uuid, video.channel.name + "@" + video.channel.host, video.channel.name, video.id);
                } else if (walletData.lnurl) {
                  sendSats(walletData.lnurl, streamAmount, "Streaming Sats", userName);
                  walletData = await refreshWalletInfo(walletData.address);
                }
                lastStream = currentTime;
              }
              if (delta > 63 || delta < 0) {
                lastStream = currentTime;
              }
            }
          }, 1000);
        }
      } else {
        let buttonBlock = document.getElementsByClassName('lightning-buttons-block')
        if (buttonBlock.length > 0) {
          buttonBlock[0].remove();
        }
      }
    }
  })

  registerHook({
    target: 'action:video-channel-update.video-channel.loaded',
    handler: async () => {
      let channelUpdate = document.getElementsByClassName("margin-content");
      let channel = (window.location.href).split("/").pop();
      let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let panel = await getConfigPanel(walletInfo, feedID, channel);
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      document.getElementById("update").onclick = async function () {
        setFeedID(channel, id.value);
      }
    }
  })

  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      clearInterval(menuTimer);
      
      let element = document.querySelector('.stream-box')
      if (element != null) {
        element.remove();
      }
      console.log("creating html for left side menu", streamAmount, userName);
      let html = `
          <div id="streamdialog">
          <input STYLE="color: #000000; background-color: #ffffff;" type="checkbox" id="streamsats" name="streamsats" value="streamsats">
          <label>Stream Sats while viewing</label><br>
          <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="streamamount" name="streamamount" value="`+ streamAmount + `" size="6"><label for="sats"> Sats per minute</label><br>
          </div>
          `;
      const panel = document.createElement('div');
      panel.setAttribute('class', 'stream-box');
      panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      panel.id = 'stream-box';
      panel.innerHTML = html;
      menuTimer = setInterval(async function () {
        if ((document.querySelector('.top-menu .stream-box') === null)) {
          const topMenu = document.querySelector('.top-menu');
          if (topMenu) {
            topMenu.insertBefore(panel, topMenu.firstChild);
            console.log("panel inserted", topMenu);
            let dialogElement = document.getElementById("satdialog");
            if (dialogElement) {
              dialogElement.style.display = "none"
              console.log("panel hidden");
            }
            console.log("hiding stream if not defined");
            let dialog2Element = document.getElementById("streamdialog");
            if (streamEnabled) {
              dialog2Element.style.display = "block";
            } else {
              dialog2Element.style.display = "none"
            }
            console.log("settinhg checkbox status and creating onclick");
            let checker = document.getElementById("streamsats");
            let currentStreamAmount = document.getElementById('streamamount');
            if (checker) {
              if (streamEnabled) {
                checker.checked = true;
              }
              checker.onclick = async function () {
                console.log("check box clicked");
                console.log(checker.checked);
                streamEnabled = checker.checked;
                if (currentStreamAmount) {
                  streamAmount = parseInt(currentStreamAmount.value);
                  console.log("setting stream amount to", streamAmount);
                }
              }
            } else {
              console.log("no click box found");
            }
            if (currentStreamAmount) {
              currentStreamAmount.value = streamAmount;
              currentStreamAmount.onchange = async function () {
                streamAmount = currentStreamAmount.value;
                notifier.success("Stream amount changed to ⚡" + streamAmount + "($" + (streamAmount * convertRate).toFixed(2) + ")");
              }
            }
          }
        }
      }, 100);
    }
  })
  async function sendSats(walletData, amount, message, from) {
    let result;
    if (!from) {
      from = "";
    } else {
      from = from + ": ";
    }
    if (!message) {
      message = "";
    }
    let comment = from + message;
    /*
    if (!parseInt(amount)) {
      amount = "69";
    }
    */
    //fixing millisats for lnpay
    amount = amount * 1000
    console.log("parsint", parseInt(amount));
    let supported = true;
    try {
      await webln.enable();
    } catch {
      //await alertUnsupported();
      //makeQrDialog(invoice);
      supported = false;
    }
    console.log("webln enabled:", supported);
    //TODO properly build this
    let urlCallback = encodeURI(walletData.callback);
    //let urlFrom = encodeURIComponent(from);

    let urlComment = encodeURIComponent(comment);
    let invoiceApi = basePath + "/getinvoice?callback=" + urlCallback + "&amount=" + amount;
    if (comment != "") {
      invoiceApi = invoiceApi + "&message=" + urlComment;
    }
    console.log("invoice api", invoiceApi);
    try {
      result = await axios.get(invoiceApi);
    } catch (err) {
      console.log("error getting lnurl invoice");
      return;
    }
    //console.log("result.data", result.data);
    let invoice = result.data.pr;
    console.log("invoice", invoice);
    try {
      if (supported) {
        result = await window.webln.sendPayment(invoice);
        lastTip = amount / 1000
        notifier.success("⚡" + lastTip + "($" + (lastTip * convertRate).toFixed(2) + ") " + tipVerb + " sent");
        return result;
      } else {
        makeQrDialog(invoice);
        return;
      }
    } catch (err) {
      notifier.error("failed sending " + tipVerb + "\n" + err.message);
      return;
    }
  }
  async function boost(walletData, amount, message, from, channel, episode, type, episodeGuid, guid, channelName, itemID) {
    console.log(walletData, amount, message, from, channel, episode, type, episodeGuid, guid, channelName, itemID)
    console.log("maybe the url:", window.location.href);
    try {
      let supported = await webln.enable();
    } catch {
      await alertUnsupported();
      return;
    }
    console.log("boosting", walletData, amount, message, from, channel, episode);
    /*if (!message) {
      message = ":)";
    }
    if (!parseInt(amount)) {
      amount = "69";
    }
    */
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
      app_version: "1.1",
      name: "Channel",
    };
    if (type == "stream") {
      boost.seconds_back = 60;
    }
    //if (channel = "clip channel") {
    //  boost.feedID = 5714728
    //}
    if (from) {
      boost.sender_name = from;
    }
    if (message) {
      boost.message = message;
    }
    if (currentTime) {
      boost.ts = parseInt(currentTime.toFixed());
    } else {
      console.log("no current time value for boost");
    }
    if (channel) {
      boost.podcast = channel;
    }
    if (episode) {
      boost.episode = episode;
    }
    if (guid) {
      boost.guid = guid;
    }
    if (episodeGuid) {
      boost.episode_guid = episodeGuid;
    }
    if (window.location.href) {
      boost.boost_link = window.location.href;
      if (currentTime) {
        boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed();
      }
    }
    if (channelName) {
      boost.url = window.location.protocol + "://" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channelName
    }

    if (itemID) {
      boost.itemID = itemID;
    }
    let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
    console.log("item api", itemApi);
    try {
      let itemId = await axios.get(itemApi);
      console.log("got item", itemId);
      if (itemId) {
        console.log("found item id ", itemId.data);
        boost.itemID = itemId.data;
      }
    } catch (err) {
      console.log("error attempting to fetch item id", err);
    }
    let feedApi = basePath + "/getfeedid?channel=" + channelName;
    console.log("feed api", feedApi);
    try {
      let feedId = await axios.get(feedApi);
      console.log("got feed", feedId);
      if (feedId) {
        console.log("found feed id ", feedId.data);
        boost.feedID = feedId.data;
      }
    } catch (err) {
      console.log("error attempting to fetch feed id", err);
    }
    let paymentInfo;
    console.log("video boost updated", boost);
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
      lastTip = amount
      notifier.success("⚡" + lastTip + "($" + (lastTip * convertRate).toFixed(2) + ") " + tipVerb + " sent");
      return result;
    } catch (err) {
      console.log("error attempting to send sats", err.message);
      notifier.error("failed sending " + tipVerb + "\n" + err.message);
      return;
    }
  }
  async function getFeedID(channel) {
    let feedApi = basePath + "/getfeedid?channel=" + channel;
    try {
      let feedId = await axios.get(feedApi);
      if (feedId) {
        return feedId.data;
      }
    } catch (err) {
      console.log("error attempting to fetch feed id", err);
      return;
    }
  }
  async function setFeedID(channel, feedID) {
    let feedApi = basePath + "/setfeedid?channel=" + channel + "&feedid=" + feedID;
    try {
      await axios.get(feedApi);
    } catch (err) {
      console.log("error attempting to fetch feed id", err);
    }
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
    return walletData.data;
  }
  async function refreshWalletInfo(address) {
    if (address) {
      if (address.indexOf("@") < 1) {
        console.log("not a valid address")
        return;
      }
      let walletApi = basePath + "/walletinfo?address=" + address;
      console.log("api call for video wallet refresh", walletApi);
      let walletData;
      try {
        walletData = await axios.get(walletApi);
      } catch {
        console.log("client unable to fetch wallet data\n", walletApi);
        return;
      }
      console.log("returned wallet data", walletData.data);
      return walletData.data;
    }
  }
  async function alertUnsupported() {

    peertubeHelpers.showModal({
      title: 'No WebLN provider found',
      content: `<p>You can get the <a href ="https://getalby.com/">Alby plug in</a> for most popular browsers.<br>
       You can use one of their wallets, or link the plugin to <a href="https://cryptonews.com/exclusives/7-popular-bitcoin-lightning-network-wallets-for-2022.htm">any lightning compatible wallet</a><p>
       There are <a href= "https://webln.dev/#/">Several other options</a> for using WebLN available as well<p>
       `,
      close: true,
    })
  }
  async function getConfigPanel(walletInfo, feedID, channel) {
    let html = "podcast RSS feed URL: " + window.location.protocol + "//" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channel;
    html = html + "<br> Wallet Address: " + walletInfo.address
    if (walletInfo.keysend) {
      html = html + "<br> Keysend: " + walletInfo.keysend.status;
      html = html + "<br> Keysend pubkey: " + walletInfo.keysend.pubkey
    }
    if (walletInfo.lnurl) {
      html = html + "<br> LNURL callback: " + walletInfo.lnurl.callback;
    }
    html = html + "<br> Podcast Index Feed ID:";
    html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="id" name="id" value="` + feedID + `">`
    html = html + `<button type="button" id="update" name="update">Update</button>`
    const panel = document.createElement('div');
    panel.setAttribute('class', 'lightning-button');
    panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    panel.innerHTML = html;
    return panel;
  }
  async function buildTip(walletData, channelName, displayName, episodeName, guid, episodeGuid, itemID) {
    console.log("clicked on tip button", walletData, channelName, displayName, episodeName, guid, episodeGuid, itemID);
    let amount = document.getElementById('modal-sats').value;
    let message = document.getElementById('modal-message').value;
    let from = document.getElementById('modal-from').value;
    let plugin;
    try {
      await webln.enable();
      plugin = true;
    } catch {
      plugin = false;
    }
    let result;
    console.log(plugin, walletData);
    if (walletData.keysend && plugin) {
      console.log("sending keysend boost");
      console.log(walletData.keysend, amount, message, from, displayName, episodeName, "boost", episodeGuid, guid, channelName, itemID)
      result = await boost(walletData.keysend, amount, message, from, displayName, episodeName, "boost", episodeGuid, guid, channelName, itemID);
    } else if (walletData.lnurl) {
      console.log("sending lnurl boost");
      result = await sendSats(walletData.lnurl, amount, message, from);
      walletData = await refreshWalletInfo(walletData.address);
    }
    if (result) {
      document.getElementById("modal-message").value = "";
      return walletData;
    } else {
      //document.getElementById("modal-message").value = "error attempting send " + tipVerb;
      return walletData;
    }
  }
  async function makeQrDialog(invoice) {
    console.log("making qr dialog", invoice);
    let html = "<h1>No WebLN Found</h1>" +
      `We were unable to find a WebLN provider in your browser to automate the ` + tipVerb +
      ` process. This is much easier if you get the <a href="https://getalby.com">Alby browser plug-in</a>` +
      `<br> If you have a wallet you can scan this qr code or paste the ` +
      `provided code to wallet<br>Transaction code:` +
      `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="ln-code" name="ln-code" value="` + invoice + `"><br>` +
      `<button type="button" id="copy" name="copy" class="peertube-button orange-button ng-star-inserted">Copy to clipboard</button>` +
      `<div id="qr-holder"><canvas id="qr"></canvas></div>`;
    let modal = (document.getElementsByClassName('modal-body'))
    //const panel = document.createElement('div');
    //panel.setAttribute('class', 'lightning-button');
    //panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    // panel.innerHTML = html;
    modal[0].innerHTML = html;
    var qr = new QRious({
      element: document.querySelector('qr'),
      value: invoice,
      size: 256,
    });
    document.getElementById('qr-holder').appendChild(qr.image);
    let lnCode = document.getElementById('ln-code')
    lnCode.select;
    let copyButton = document.getElementById('copy');
    copyButton.onclick = async function () {
      navigator.clipboard.writeText(lnCode.value);
      copyButton.textContent = "Copied!";
      return;
    }
  }
  async function makeTipDialog(channelName) {
    console.log("making tip dialog", channelName);
    let buttonText = '⚡️' + tipVerb + " " + channelName + '⚡️';
    let html = "<h1>" + tipVerb + "</h1>" +
      `<div id="modal-streamdialog">
    <input STYLE="color: #000000; background-color: #ffffff;" type="checkbox" id="modal-streamsats" name="modal-streamsats" value="streamsats">
    <label>Stream Sats per minute:</label>
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-streamamount" name="modal-streamamount" value="`+ streamAmount + `" size="6">
    / $
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-cashamount" name="modal-cashamount" value="`+ (streamAmount * convertRate).toFixed(3) + `" size="6">
    </div>
   <hr>
    <div id="satdialog" ><center>
    <h2><center>`+ tipVerb + `</center></h2>
    <label for="from">From:</label>
    <input STYLE="color: #000000; background-color: #ffffff;" type="text" id="modal-from" name="modal-from" value="`+ userName + `" autocomplete="on" maxLength="28">
    <br><label for="sats"> Sats:</label><input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-sats" name="modal-sats" value="`+ lastTip + `" size="8">
    / $
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-cashtip" name="modal-cashtip" value="`+ (lastTip * convertRate).toFixed(3) + `" size="6">
    <br><label for="message">Message:</label>
    <br><textarea STYLE="color: #000000; background-color: #ffffff; flex: 1;" rows="3" cols=64 id="modal-message" name="modal-message" maxLength="128"></textarea>
    </center></div><div _ngcontent-cav-c133="" class="lighting-pay-button ng-star-inserted">
    <p id = "modal-satbutton" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="satbutton">`+ buttonText + `</p>
    `;
    let modal = (document.getElementsByClassName('modal-body'))
    //const panel = document.createElement('div');
    //panel.setAttribute('class', 'lightning-button');
    //panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    //panel.innerHTML = html;
    //console.log("panel",panel);
    modal[0].innerHTML = modal[0].innerHTML + html;
    let modalSatStream = document.getElementById("modal-streamamount");
    let modalCashStream = document.getElementById("modal-cashamount");
    let modalSatTip = document.getElementById("modal-sats");
    let modalCashTip = document.getElementById("modal-cashtip");
    let menuStreamAmount = document.getElementById('streamamount');
    if (modalSatStream) {
      modalSatStream.onchange = async function () {
        modalCashStream.value = (modalSatStream.value * convertRate).toFixed(2);
        streamAmount = modalSatStream.value
        if (menuStreamAmount) {
          console.log(menuStreamAmount);
          menuStreamAmount.value = streamAmount;
        }
      }
    }
    if (modalCashStream) {
      modalCashStream.onchange = async function () {
        modalSatStream.value = (modalCashStream.value / convertRate).toFixed();
        streamAmount = modalSatStream.value;
        if (menuStreamAmount) {
          console.log(menuStreamAmount);
          menuStreamAmount.value = streamAmount;
        }
      }
    }
    if (modalSatTip) {
      modalSatTip.onchange = async function () {
        modalCashTip.value = (modalSatTip.value * convertRate).toFixed(2);
      }
    }
    if (modalCashTip) {
      modalCashTip.onchange = async function () {
        modalSatTip.value = (modalCashTip.value / convertRate).toFixed();
      }
    }
    let modalChecker = document.getElementById("modal-streamsats");
    if (modalChecker) {
      if (streamEnabled) {
        modalChecker.checked = true;
      }
      modalChecker.onclick = async function () {
        //let modalChecker = document.getElementById("modal-streamsats");
        let menuChecker = document.getElementById("streamsats");
        streamEnabled = modalChecker.checked;
        if (menuChecker) {
          menuChecker.checked = streamEnabled;
        }
        let currentStreamAmount = document.getElementById('modal-streamamount');

        if (currentStreamAmount) {
          streamAmount = parseInt(currentStreamAmount.value);
          console.log("setting moidal stream amount to", streamAmount);
          if (menuStreamAmount) {
            menuStreamAmount.value = streamAmount;
          }
          let dialog2Element = document.getElementById("streamdialog");
          if (dialog2Element) {
            if (streamEnabled) {
              dialog2Element.style.display = "block";
            } else {
              dialog2Element.style.display = "none"
            }
          }
        } else {
          console.log("really not sure how this error could logically be reached", currentStreamAmount, streamAmount);
        }
      }
    }
  }
}
export {
  register
}
