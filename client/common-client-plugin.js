import axios from 'axios'; 1000
import QRious from 'qrious';
//import QRCode from 'qrcode';
//var qrcode = new QRCode("qrcode");
async function register({ registerHook, peertubeHelpers }) {
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();
  let tipVerb = "tip";
  let streamAmount = 69;
  let lastTip = 69;
  let convertRate = .0002;
  let userName = "PeerTuber";
  let streamEnabled = false;
  let menuTimer, streamTimer, wallet, currentTime;
  peertubeHelpers.getSettings()
    .then(s => {
      tipVerb = s['lightning-tipVerb'];
      // split = s['lightning-split'];
    })
  try {
    let conversionData = await axios.get("https://api.coincap.io/v2/rates/bitcoin")
    if (conversionData.data.data.rateUsd) {
      convertRate = conversionData.data.data.rateUsd / 100000000
      console.log("updating conversion rate", convertRate)
    }
  } catch {
    console.log("error getting conversion rate. Falling back to", convertRate);
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
      let buttonBlock = document.getElementsByClassName('tip-buttons-block')
      if (buttonBlock.length > 0) {
        buttonBlock[0].remove();
      }
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
      let episodeGuid = video.uuid;
      let displayName = video.channel.displayName;
      let addSpot = document.getElementById('plugin-placeholder-player-next');
      let text = video.support + ' ' + video.channel.support + ' ' + video.channel.description + ' ' + video.account.description + ' ' + video.description;
      text = text.split("\n").join(" ");
      //var regex = /(https:[/][/]|http:[/][/]|www.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?\/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])/g;
      //var regex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
      var regex = /\b(https?:\/\/.*?\.[a-z]{2,4}\/[^\s]*\b)/g;
      var result = null;
      if (regex.test(text)) {
        result = text.match(regex);
        console.log("urls found", result);
      }
      var tipeeeLink, streamlabsLink;
      var donationalertsLink, kofiLink, donatestreamLink;
      var buttonHTML = "";
      if (result) {
        for (var url of result) {
          if ((url.indexOf("tipeeestream.com") > 0) && (buttonHTML.indexOf("tipeee") <= 0)) {
            console.log("found tipeeestream", url);
            tipeeeLink = url;
            buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" type="button" title="tipeee" id = "tipeee" class="peertube-button orange-button ng-star-inserted"><span _ngcontent-vww-c178="" class="ng-star-inserted">Tipeee<!----><!----><!----></span><!----><!----></button>`
          }
          if ((url.indexOf("streamlabs.com") > 0) && (buttonHTML.indexOf("streamlabs") <= 0)) {
            streamlabsLink = url;
            console.log("found streamlabs", url);
            buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "streamlabs" type="button" class="peertube-button orange-button ng-star-inserted"><span _ngcontent-vww-c178="" class="ng-star-inserted">Streamlabs<!----><!----><!----></span><!----><!----></button>`
          }
          if ((url.indexOf("donationalerts.com") > 0) && (buttonHTML.indexOf("donationalerts") <= 0)) {
            donationalertsLink = url;
            console.log("found donationalerts", url);
            buttonHTML = buttonHTML + ` <a display:none id = "donationalerts" class="peertube-button orange-button ng-star-inserted" title="donationalerts">Donation Alerts</a>`
          }
          if ((url.indexOf("donate.stream") > 0) && (buttonHTML.indexOf("donatestream") <= 0)) {
            donatestreamLink = url;
            console.log("found donatestream", url);
            buttonHTML = buttonHTML + ` <a display:none id = "donatestream" class="peertube-button orange-button ng-star-inserted" title="donatestream">donation.stream</a>`
          }
          if ((url.indexOf("ko-fi.com") > 0) && (buttonHTML.indexOf("kofi") <= 0)) {
            kofiLink = url + "#checkoutModal";
            console.log("found kofi", url);
            buttonHTML = buttonHTML + ` <a display:none id = "kofi" class="peertube-button orange-button ng-star-inserted" title="kofi">Ko-Fi</a>`
          }
        }
      }
      let splitData = await getSplit(videoName, accountName, channelName, instanceName);
      //console.log("Split data",splitData);
      //let walletData = await getWalletInfo(videoName, accountName, channelName, instanceName);
      var streamButtonText;
      if (splitData) {
        if (!document.querySelector('.lightning-buttons-block')) {
          if (streamEnabled) {
            streamButtonText = "⚡️" + streamAmount + "/min";
          } else {
            streamButtonText = "⚡️Stream Sats";
          }
          buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "boostagram" type="button" class="peertube-button orange-button ng-star-inserted">⚡️` + tipVerb + `</button>`
          buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "stream" type="button" class="peertube-button orange-button ng-star-inserted">` + streamButtonText + `</button>`
          let delta = 0;
          let lastStream = videoEl.currentTime;
          streamTimer = setInterval(async function () {
            currentTime = videoEl.currentTime;
            if (streamEnabled) {
              delta = (currentTime - lastStream).toFixed();
              console.log(delta, streamEnabled);
              if (delta > 60 && delta < 64) {
                try {
                  await webln.enable();
                } catch {
                  await alertUnsupported();
                  streamEnabled = false;
                  let modalChecker = document.getElementById("modal-streamsats");
                  if (modalChecker) {
                    modalChecker.checked = false;
                  }
                  let menuChecker = document.getElementById("streamsats");
                  if (menuChecker) {
                    menuChecker.checked = false;
                  }
                  return;
                }
                for (var wallet of splitData) {
                  var amount = streamAmount * (wallet.split / 100);
                  let result;
                  if (wallet.keysend) {
                    result = await boost(wallet.keysend, amount, null, userName, video.channel.displayName, video.name, "stream", video.uuid, video.channel.name + "@" + video.channel.host, video.channel.name, video.id);
                  } else if (wallet.lnurl) {
                    result = await sendSats(wallet.lnurl, amount, "Streaming Sats", userName);
                    //walletData = await refreshWalletInfo(walletData.address);
                  }
                  console.log("boosting " + wallet.address + " tried to send " + amount + " ended up with " + result);
                }
                lastStream = currentTime;
              }
              if (delta > 63 || delta < 0) {
                lastStream = currentTime;
              }
            }
          }, 1000);
        }
      }
      const elem = document.createElement('div');
      elem.className = 'tip-buttons-block';
      elem.innerHTML = buttonHTML;
      addSpot.appendChild(elem);
      const boostButton = document.getElementById("boostagram");
      if (boostButton) {
        document.getElementById("boostagram").onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Support ' + channelName,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },
          })
          await makeTipDialog(displayName);
          let tipButton = document.getElementById('modal-satbutton');
          if (tipButton) {
            tipButton.onclick = async function () {

            await buildTip(splitData, channelName, displayName, episodeName, episodeGuid, itemID);
            }
          }
        }
      }
      const streamButton = document.getElementById("stream");
      if (streamButton) {
        var popup;
        document.getElementById("stream").onclick = async function () {
          popup = await peertubeHelpers.showModal({
            title: 'Stream sats for ' + channelName,
            content: ` `,
            close: true,
            //confirm: { value: 'close', id: 'streamingsatsclose', action: () => { } },

          })
          console.log("popup", popup);
          await makeStreamDialog(displayName);
          let streamButton = document.getElementById('modal-streambutton');
          if (streamButton) {
            streamButton.onclick = async function () {

              walletData = await buildTip(walletData, channelName, displayName, episodeName, episodeGuid, itemID);
            }
          }
        }
      }
      const streamlabsButton = document.getElementById("streamlabs")
      if (streamlabsButton) {
        streamlabsButton.onclick = async function () {
          console.log("streamlabs link", streamlabsLink);
          window.open(streamlabsLink, 'popup', 'width=600,height=800');
        }
      }
      const tipeeeButton = document.getElementById("tipeee")
      if (tipeeeButton) {
        tipeeeButton.onclick = async function () {
          console.log("tipeee link", tipeeeLink);
          window.open(tipeeeLink, 'popup', 'width=1100,height=700');
        }
      }
      const donationalertsButton = document.getElementById("donationalerts")
      if (donationalertsButton) {
        donationalertsButton.onclick = async function () {
          console.log("Donationalerts link", donationalertsLink);
          window.open(donationalertsLink, 'popup', 'width=600,height=800');
        }
      }
      const donatestreamButton = document.getElementById("donatestream")
      if (donatestreamButton) {
        donatestreamButton.onclick = async function () {
          console.log("donatestream link", donatestreamLink);
          window.open(donatestreamLink, 'popup', 'width=600,height=800');
        }
      }
      const kofiButton = document.getElementById("kofi")
      if (kofiButton) {
        kofiButton.onclick = async function () {
          console.log("kofi link", kofiLink);
          window.open(kofiLink, 'popup', 'width=600,height=800');
        }
      }
    }
  })

  registerHook({
    target: 'action:video-channel-update.video-channel.loaded',
    handler: async () => {
      let channelUpdate = document.getElementsByClassName("form-group");
      let channel = (window.location.href).split("/").pop();
      let splitData = await getSplit(null, null, channel);
      //console.log(splitData);
      //let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let panel = await getConfigPanel(splitData, feedID, channel);
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      let updateButton = document.getElementById("update-feed");
      document.getElementById("update-feed").onclick = async function () {
        setFeedID(channel, id.value);
        updateButton.innerText = "Updated!";

      }
      document.getElementById("add-split").onclick = async function () {
        console.log("doin it!");
        await peertubeHelpers.showModal({
          title: 'Add Split for' + channel,
          content: ` `,
          close: true,
          //confirm: { value: 'close', id: 'streamingsatsclose', action: () => { } },

        })
        let modal = (document.getElementsByClassName('modal-body'))
        //modal[0].setAttribute('class', 'lightning-button');
        modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        modal[0].innerHTML = `<label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="0"><br>
        <label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address"><br>
        <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add New Split</button>`;
        document.getElementById("add-split-final").onclick = async function () {
          console.log("call the add api now");
          let newSplit = document.getElementById("modal-split-value").value;
          let newAddress = document.getElementById("modal-split-address").value;
          let addApi = `/addsplit?channel=`+channel+`&split=`+newSplit+`&splitaddress=`+newAddress;
          let addResult;
          try {
            addResult = await axios.get(basePath+addApi);
          } catch {
            console.log("client unable to fetch wallet data\n",addApi );
            return;
          }
          if (addResult){
            console.log("addResult",addResult.data);
          }
        }
      }
    }
  })
  /*
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
      let modalExists = false;
      menuTimer = setInterval(async function () {
        let checker = document.getElementById("streamsats");
        //console.log("checker",checker);
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

            let currentStreamAmount = document.getElementById('streamamount');
            if (checker) {
              console.log("setting checker on click", checker);
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
              console.log("no checkbox");
              if (currentStreamAmount) {
                currentStreamAmount.value = streamAmount;
                currentStreamAmount.onchange = async function () {
                  streamAmount = currentStreamAmount.value;
                  notifier.success("Stream amount changed to ⚡" + streamAmount + "($" + (streamAmount * convertRate).toFixed(2) + ")");
                }
              }
            }
          }

          /*
          let modal = (document.getElementsByClassName('modal-title'));
          if (modal[0]) {
            if (!modalExists) {
              console.log("modal", modal[0]);
              modalExists = true;
              if (modal[0].value.indexOf("Support">0)){
                console.log("need to add support block");
              }
            }
          } else {
            modalExists = false;
          }
    
        }
        if (checker) {
          //console.log("checker", checker.checked);
          if (checker.checked) {
            streamEnabled = true;
          } else {
            streamEnabled = false;
          }
        }
      }, 100);
    }
  })
  */
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
     console.log("result.data", result.data);
    let invoice = result.data.pr;
    console.log("invoice", invoice);
    try {
      if (supported) {
        result = await window.webln.sendPayment(invoice);
        var tipfixed = amount / 1000
        notifier.success("⚡" + tipfixed + "($" + (tipfixed * convertRate).toFixed(2) + ") " + tipVerb + " sent");
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
  async function boost(walletData, amount, message, from, channel, episode, type, episodeGuid, channelName, itemID) {
    //console.log(walletData, amount, message, from, channel, episode, type, episodeGuid, channelName, itemID)
    //console.log("maybe the url:", window.location.href);
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
    //console.log("parsint", parseInt(amount));
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
    //console.log("parameters normalized", walletData);
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKeyHack, customValue
    if (walletData.customData) {
      customKeyHack = walletData.customData[0].customKey;
      customValue = walletData.customData[0].customValue;
    }
    //console.log("wallet variables set");
    const boost = {
      action: type,
      value_msat: amount * 1000,
      value_msat_total: amount * 1000,
      app_name: "PeerTube",
      app_version: "1.1",
      name: channel,
    };
    if (type == "stream") {
      boost.seconds_back = 60;
    }
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
    //  if (guid) {
    //    boost.guid = guid;
    //  }
    // for some reason episode guid is the url not an actual guid but a url.
    //  if (episodeGuid) {
    //    boost.episode_guid = episodeGuid;
    //  }
    if (window.location.href) {
      boost.episode_guid = window.location.href;
      boost.boost_link = window.location.href;
      if (currentTime) {
        boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed();
      }
    }
    if (channelName) {
      boost.url = window.location.protocol + "//" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channelName
    }

    if (itemID) {
      boost.itemID = itemID;
    }
    let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
    //console.log("item api", itemApi);
    try {
      let itemId = await axios.get(itemApi);
      //console.log("got item", itemId);
      if (itemId) {
        //console.log("found item id ", itemId.data);
        boost.itemID = itemId.data;
      }
    } catch (err) {
      //console.log("error attempting to fetch item id", err);
    }

    let feedApi = basePath + "/getfeedid?channel=" + channelName;
    //console.log("feed api", feedApi);
    try {
      let feedId = await axios.get(feedApi);
      //console.log("got feed", feedId);
      if (feedId) {
        //console.log("found feed id ", feedId.data);
        boost.feedID = feedId.data;
      }
    } catch (err) {
      //console.log("error attempting to fetch feed id", err);
    }
    let guid;
    let guidApi = basePath + "/getchannelguid?channel=" + channelName;
    //console.log("guid api", guidApi);
    try {
      guid = await axios.get(guidApi);
      //console.log("got guid", guid);
      if (guid) {
        //console.log("found guid", guid.data);
        boost.guid = guid.data;
      }
    } catch (err) {
      //console.log("error attempting to fetch guid", err);
    }
    let paymentInfo;
    // console.log("video boost updated", boost);
    if (customValue) {
      paymentInfo = {
        destination: pubKey,
        amount: amount,
        customRecords: {
          7629169: JSON.stringify(boost),
          [customKeyHack]: customValue,
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
      var tipfixed = amount
      notifier.success("⚡" + tipfixed + "($" + (tipfixed * convertRate).toFixed(2) + ") " + tipVerb + " sent");
      return result;
    } catch (err) {
      console.log("error attempting to send sats using keysend", err.message);
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
      //console.log("error attempting to fetch feed id", err);
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

  async function getSplit(videoName, accountName, channelName, instanceName) {
    console.log(videoName, accountName, channelName, instanceName);
    let splitApi = basePath + "/getsplit";
    if (videoName) {
      if (instanceName) {
        splitApi = splitApi + "?video=" + videoName + "&account=" + accountName + "@" + instanceName + "&channel=" + channelName + "@" + instanceName;
      } else {
        splitApi = splitApi + "?video=" + videoName + "&account=" + accountName + "&channel=" + channelName;
      }
    } else {
      if (accountName) {
        splitApi = splitApi + "?account=" + accountName;
      }
      if (channelName) {
        splitApi = splitApi + "?channel=" + channelName;
      }
      if (instanceName) {
        splitApi = splitApi + "@" + instanceName;
      }
    }
    console.log("api call for split info", splitApi);
    let splitData;
    try {
      splitData = await axios.get(splitApi);
    } catch {
      console.log("client unable to fetch split data\n", splitApi);
      return;
    }
    console.log("returned split data", splitData.data);
    return splitData.data;
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
  async function getConfigPanel(splitInfo, feedID, channel) {
    let html = `<br><label _ngcontent-msy-c247="" for="Wallet">Lightning Plugin Info</label><br>`
    html = html + "podcast RSS feed URL: " + window.location.protocol + "//" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channel;
    if (splitInfo) {
      console.log("generating split text info");
      //html = html + "<br> Wallet Address: " + splitInfo[0].address
      if (splitInfo[0].keysend) {
        html = html + "<br> Keysend: " + splitInfo[0].keysend.status;
        html = html + "<br> Keysend pubkey: " + splitInfo[0].keysend.pubkey
        html = html + "<br> keysend custom key:" + splitInfo[0].keysend.customData[0].customKey;
        html = html + "<br> keysend custom value:" + splitInfo[0].keysend.customData[0].customValue;
      }
      if (splitInfo[0].lnurl) {
        html = html + "<br> LNURL callback: " + splitInfo[0].lnurl.callback;
      }
      console.log(html.length);
      if (splitInfo.length > 0) {
        html = html + "<br>Sat Splits<br><table><th>Split %</th><th><center>Lighting Address</center></th><th>Address Type</th></tr>";
        for (var split in splitInfo) {
          html = html + "<tr><td>" + splitInfo[split].split + "</td><td>" + splitInfo[split].address + "</td>";
          if (splitInfo[split].keysend) {
            html = html + `<td>Keysend</td><td><button class="peertube-button orange-button ng-star-inserted" id="edit-`+ splitInfo[split].address+`">edit</button></td>`;
          } else {
            html = html + "<td>LNURL Pay</td>";
          }
          html = html +"</tr>";
        }
        html = html + "</table>";
      }
      html = html + `<button type="button" id="add-split" class="peertube-button orange-button ng-star-inserted">Add Split</button>`
      html = html + "<br> Podcast Index Feed ID:";
      html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="id" name="id" value="` + feedID + `">`
      html = html + `<button type="button" id="update-feed" name="update-feed" class="peertube-button orange-button ng-star-inserted">Update</button>`
    }
    const panel = document.createElement('div');
    panel.setAttribute('class', 'lightning-button');
    panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    panel.innerHTML = html;
    return panel;
  }
  async function buildTip(splitData, channelName, displayName, episodeName, episodeGuid, itemID) {
    console.log("clicked on tip button", splitData, channelName, displayName, episodeName, episodeGuid, itemID);
    let amount = document.getElementById('modal-sats').value;
    let message = document.getElementById('modal-message').value;
    let from = document.getElementById('modal-from').value;
    let weblnSupport = await checkWebLnSupport();
    lastTip=amount;
    //notifier.success(weblnSupport);
    let result;
    for (var wallet of splitData) {
      var splitAmount = amount * (wallet.split / 100);
      if (wallet.keysend && weblnSupport > 1) {
        //notifier.success("sending keysend boost");
        console.log("sending keysend boost");
        console.log(wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, channelName, itemID)
        result = await boost(wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, channelName, itemID);
      } else if (wallet.lnurl) {
        console.log("sending lnurl boost");
        result = await sendSats(wallet.lnurl, splitAmount, message, from);
        //walletData = await refreshWalletInfo(walletData.address);
      }
    }
    let butts = document.getElementsByClassName("peertube-button orange-button ng-star-inserted")
    //console.log("-------------- buttons:\n",butts)
    if (result) {
      for (var butt of butts){
        if (butt.value=="X"){
          butt.click();
        }
      }
      //document.getElementById("modal-message").value = "";

      return ;
    } else {
      document.getElementById("modal-message").value = "error attempting send " + tipVerb;
      return ;
    }
  }
  async function makeQrDialog(invoice) {
    console.log("making qr dialog", invoice);
    let html = "<h1>No WebLN Found</h1>" +
      `We were unable to find a WebLN provider in your browser to automate the ` + tipVerb +
      ` process. This is much easier if you get the <a href="https://getalby.com">Alby browser plug-in</a>` +
      `<br> If you have a wallet you can scan this qr code, open a local wallet, or copy/paste the ` +
      `provided code to a wallet` +
      //`<br><textarea STYLE="color: #000000; background-color: #ffffff; flex: 1;" rows="5" cols=64 id="ln-code" name="ln-code">` + invoice + `</textarea><br>` +
      //`<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="ln-code" name="ln-code" value="` + invoice + `"><br>` +
      `<button type="button" id="copy" name="copy" class="peertube-button orange-button ng-star-inserted">Copy to clipboard</button>`+
      `<a href="lightning:`+invoice+`"><button type="button" id="copy" name="copy" class="peertube-button orange-button ng-star-inserted">open local wallet</button></a>`+
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
    let html = ` <center><table><tr><td>From:</td>
   <td style="text-align:right;"><input STYLE="color: #000000; background-color: #ffffff;" type="text" id="modal-from" name="modal-from" value="`+ userName + `" autocomplete="on" maxLength="28"></td></tr>
   <tr><td>Sats:</td>
   <td style="text-align:right;"><input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-sats" name="modal-sats" value="`+ lastTip + `" size="6"></td></tr>
    
    <td>&nbsp;</td><td style="text-align:right;">~$ <label id="modal-cashtip" name="modal-cashtip">`+ (lastTip * convertRate).toFixed(3) + `</label></td></tr>
    
    <tr><td><label for="message">Message:</label><br></td></tr>
    
    <tr><td colspan="2"><textarea STYLE="color: #000000; background-color: #ffffff; flex: 1;" rows="3" cols=30 id="modal-message" name="modal-message"></textarea>
    </td></tr></table>
    <br><button _ngcontent-vww-c178=""  id = "modal-satbutton" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="satbutton">`+ buttonText + `</button>
    </center>`;

    let modal = (document.getElementsByClassName('modal-body'))
    //const panel = document.createElement('div');
    //panel.setAttribute('class', 'lightning-button');
    //panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    //panel.innerHTML = html;
    //console.log("panel",panel);
    modal[0].innerHTML = html;

    //modal[0].innerHTML = modal[0].innerHTML + html;
    let modalSatTip = document.getElementById("modal-sats");
    let modalCashTip = document.getElementById("modal-cashtip");
    if (modalSatTip) {
      modalSatTip.onchange = async function () {
        console.log(modalCashTip);
        modalCashTip.textContent = (modalSatTip.value * convertRate).toFixed(2);
        console.log(modalCashTip);
      }
    }
    if (modalCashTip) {
      modalCashTip.onchange = async function () {
        modalSatTip.value = (modalCashTip.value / convertRate).toFixed();
      }
    }

  }
  async function checkWebLnSupport() {
    try {
      await webln.enable()
      if (typeof webln.keysend === 'function') {
        console.log('✅ webln keysend support');
        return 2;
      } else {
        console.log("✅ webln supported ⛔️ keysend not supported");
        return 1;
      }
    } catch {
      console.log("⛔️ webln not supported");
      return 0;
    }
  }
  async function makeStreamDialog(channelName) {
    console.log("making stream dialog", channelName);
    let buttonText = '⚡️Stream⚡️';
    let html = `<div id="modal-streamdialog">
    <input STYLE="color: #000000; background-color: #ffffff;" type="checkbox" id="modal-streamsats" name="modal-streamsats" value="streamsats">
    <label>Stream Sats per minute:</label>
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-streamamount" name="modal-streamamount" value="`+ streamAmount + `" size="6">
    / $
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-cashamount" name="modal-cashamount" value="`+ (streamAmount * convertRate).toFixed(3) + `" size="6">
    </div>`;

    let modal = (document.getElementsByClassName('modal-body'))
    //const panel = document.createElement('div');
    //panel.setAttribute('class', 'lightning-button');
    //panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    //panel.innerHTML = html;
    //console.log("panel",panel);
    modal[0].innerHTML = html;

    //modal[0].innerHTML = modal[0].innerHTML + html;
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
    let modalChecker = document.getElementById("modal-streamsats");
    if (modalChecker) {
      if (streamEnabled) {
        modalChecker.checked = true;
      }
      modalChecker.onclick = async function () {
        //let modalChecker = document.getElementById("modal-streamsats");
        let menuChecker = document.getElementById("streamsats");
        let butt = document.getElementById("stream");
        streamEnabled = modalChecker.checked;
        var streamButtonText = "";
        if (streamEnabled) {
          streamButtonText = "⚡️" + streamAmount + "/min";
        } else {
          streamButtonText = "⚡️Stream Sats";
        }
        butt.textContent = streamButtonText;
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
