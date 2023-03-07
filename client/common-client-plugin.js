import axios from 'axios'; 1000
import QRious from 'qrious';
//import QRCode from 'qrcode';
//var qrcode = new QRCode("qrcode");
async function register({ registerHook, peertubeHelpers }) {
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();
  let tipVerb = "tip";
  let chatEnabled, keysendEnabled, lnurlEnabled, legacyEnabled, debugEnabled;
  let streamAmount = 69;
  let lastTip = 69;
  let convertRate = .0002;
  let userName = "PeerTuber";
  let accountName, channelName, videoName, instanceName;
  let streamEnabled = false;
  let menuTimer, streamTimer, wallet, currentTime;
  let panelHack;
  await peertubeHelpers.getSettings()
    .then(s => {
      tipVerb = s['lightning-tipVerb'];
      chatEnabled = s['irc-enable'];
      keysendEnabled = s['keysend-enable'];
      legacyEnabled = s['legacy-enable'];
      lnurlEnabled = s['lnurl-enable'];
      debugEnabled = s['debug-enable'];
      if (debugEnabled) {
        console.log("settings", s);
      }
    })
  try {
    let conversionData = await axios.get("https://api.coincap.io/v2/rates/bitcoin")
    if (conversionData.data.data.rateUsd) {
      convertRate = conversionData.data.data.rateUsd / 100000000
    }
  } catch {
    console.log("error getting conversion rate. Falling back to", convertRate);
  }
  registerHook({
    target: 'action:auth-user.information-loaded',
    handler: async ({ user }) => {
      if (user && user.account && user.account.displayName) {
        userName = user.account.displayName;
        while (userName.indexOf(' ') > 0) {
          //TODO smart people use pattern matching
          userName = userName.replace(" ", "-")
        }
      }
    }
  })

  registerHook({
    target: 'action:video-watch.video-threads.loaded',
    handler: async () => {
      let comments = document.getElementsByClassName("comment-account-fid");
      for (var com in comments) {
        let walletApi, walletData, wallet;
        let comment = comments[com];
        if (comment.wallet) {
          continue;
        }
        if (comment.innerText) {
          try {
            walletApi = basePath + "/walletinfo?account=" + comment.innerText
            walletData = await axios.get(walletApi);
            comment.wallet = walletData.data
          } catch {
            console.log("error trying to get wallet info", walletApi);
          }
        }
        if (walletData && walletData.data) {
          if ((walletData.data.keysend && keysendEnabled) || (walletData.data.lnurl && lnurlEnabled)) {
            if (debugEnabled) {
              console.log(walletData.data.keysend, keysendEnabled, walletData.lnurl, lnurlEnabled)
            }
            let zap = document.createElement("span");
            zap.innerHTML = "⚡️";
            zap.class = "action-button action-button-zap";
            zap.className = "action-button action-button-zap";
            zap.ariaPressed = "false";
            zap.title = "Zap sats to " + comment.innerText;
            zap.id = "zap-" + com;
            zap.target = comment.innerText;
            zap.style = "cursor:pointer";
            let grandParent = comment.parentElement.parentElement;
            let greatGrandParent = comment.parentElement.parentElement.parentElement;
            greatGrandParent.insertBefore(zap, grandParent);
            let zapButton = document.getElementById("zap-" + com)
            zapButton.onclick = async function () {
              walletData = null;
              this.innerText = "🗲";
              if (comment.innerText) {
                try {
                  walletApi = basePath + "/walletinfo?account=" + comment.innerText
                  walletData = await axios.get(walletApi);
                } catch {
                  console.log("error trying to get wallet info", walletApi);
                }
              }
              if (walletData) {
                wallet = walletData.data;
                let weblnSupport = await checkWebLnSupport();
                if (wallet.keysend && (weblnSupport) && keysendEnabled) {
                  await boost(wallet.keysend, 69, "Keysend Cross App Comment Zap", userName, userName, null, "boost", null, null, null, 69, this.target);
                } else if (wallet.lnurl && lnurlEnabled) {
                  await sendSats(wallet.lnurl, 69, "Cross App Comment Zap from " + userName, userName);
                }
              }
              this.innerHTML = "⚡️";
            }
          } else {
            if (debugEnabled) {
              console.log("wallet doesn't support required address type", walletData.data.address);
            }
          }
        } else {
          if (debugEnabled) {
            console.log("didn't find wallet data", walletApi)
          }
        }
      }
    }
  })

  registerHook({
    target: 'action:video-watch.video-thread-replies.loaded',
    handler: async () => {
      if (debugEnabled) {
        console.log("replies loaded");
      }
      let comments = document.getElementsByClassName("comment-account-fid");
      for (var com in comments) {
        let walletApi, walletData;
        let comment = comments[com];
        if (comment.wallet) {
          continue;
        }
        if (comment.innerText) {
          try {
            walletApi = basePath + "/walletinfo?account=" + comment.innerText
            walletData = await axios.get(walletApi);
            comment.wallet = walletData.data;
          } catch {
            console.log("error trying to get wallet info", walletApi);
          }
        }
        if (walletData) {
          if ((walletData.data.keysend && keysendEnabled) || (walletData.data.lnurl && lnurlEnabled)) {
            let zap = document.createElement("span");
            zap.innerHTML = "⚡️";
            zap.class = "action-button action-button-zap";
            zap.className = "action-button action-button-zap";
            zap.ariaPressed = "false";
            zap.title = "Zap sats to " + comment.innerText;
            zap.id = "zap-" + com;
            zap.style = "cursor:pointer";
            zap.target = comment.innerText;
            let grandParent = comment.parentElement.parentElement;
            let greatGrandParent = comment.parentElement.parentElement.parentElement;
            greatGrandParent.insertBefore(zap, grandParent);
            let zapButton = document.getElementById("zap-" + com)
            zapButton.onclick = async function () {
              walletData = null;
              this.innerText = "🗲";
              try {
                walletApi = basePath + "/walletinfo?account=" + this.target;
                walletData = await axios.get(walletApi);
              } catch {
                console.log("error trying to get wallet info", walletApi);
              }
              if (walletData) {
                var wallet = walletData.data;
                let weblnSupport = await checkWebLnSupport();
                if (wallet.keysend && (weblnSupport) && keysendEnabled) {
                  if (debugEnabled) {
                    console.log("sending keysend zap", wallet.keysend, 69, "zap from " + userName, userName, userName, null, "boost", null, null, null, 69, this.target);
                  }
                  await boost(wallet.keysend, 69, "Cross App Comment Zap from " + userName, userName, userName, null, "boost", null, null, null, 69, this.target);
                } else if (wallet.lnurl && lnurlEnabled) {
                  if (debugEnabled) {
                    console.log("sending lnurl zap", wallet.lnurl, 69, "zap from " + userName, userName);
                  }
                  await sendSats(wallet.lnurl, 69, "Cross App Comment Zap from " + userName, userName);
                }
              }
              this.innerHTML = "⚡️";
            }
          }
        } else {
          if (debugEnabled) {
            console.log("didn't find wallet data", walletApi)
          }
        }
      }
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
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      accountName = video.byAccount;
      channelName = video.byVideoChannel;
      videoName = video.uuid;
      let episodeName = video.name;
      let itemID;
      let episodeGuid = video.uuid;
      let displayName = video.channel.displayName;
      let addSpot = document.getElementById('plugin-placeholder-player-next');
      const elem = document.createElement('div');
      elem.className = 'tip-buttons-block';
      let text = video.support + ' ' + video.channel.support + ' ' + video.channel.description + ' ' + video.account.description + ' ' + video.description;
      text = text.split("\n").join(" ");
      var regex = /\b(https?:\/\/.*?\.[a-z]{2,4}\/[^\s]*\b)/g;
      var result = null;
      if (regex.test(text)) {
        result = text.match(regex);
      }
      var tipeeeLink, streamlabsLink;
      var donationalertsLink, kofiLink, donatestreamLink;
      var buttonHTML = "";
      if (result && legacyEnabled) {
        for (var url of result) {
          if ((url.indexOf("tipeeestream.com") > 0) && (buttonHTML.indexOf("tipeee") <= 0)) {
            tipeeeLink = url;
            buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" type="button" title="tipeee" id = "tipeee" class="peertube-button orange-button ng-star-inserted"><span _ngcontent-vww-c178="" class="ng-star-inserted">💲Tipeee<!----><!----><!----></span><!----><!----></button>`
          }
          if ((url.indexOf("streamlabs.com") > 0) && (buttonHTML.indexOf("streamlabs") <= 0)) {
            streamlabsLink = url;
            buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "streamlabs" type="button" class="peertube-button orange-button ng-star-inserted"><span _ngcontent-vww-c178="" class="ng-star-inserted">💲Streamlabs<!----><!----><!----></span><!----><!----></button>`
          }
          if ((url.indexOf("donationalerts.com") > 0) && (buttonHTML.indexOf("donationalerts") <= 0)) {
            donationalertsLink = url;
            buttonHTML = buttonHTML + ` <a display:none id = "donationalerts" class="peertube-button orange-button ng-star-inserted" title="donationalerts">💲Donation Alerts</a>`
          }
          if ((url.indexOf("donate.stream") > 0) && (buttonHTML.indexOf("donatestream") <= 0)) {
            donatestreamLink = url;
            buttonHTML = buttonHTML + ` <a display:none id = "donatestream" class="peertube-button orange-button ng-star-inserted" title="💲donatestream">donation.stream</a>`
          }
          if ((url.indexOf("ko-fi.com") > 0) && (buttonHTML.indexOf("kofi") <= 0)) {
            kofiLink = url + "#checkoutModal";
            buttonHTML = buttonHTML + ` <a display:none id = "kofi" class="peertube-button orange-button ng-star-inserted" title="kofi">💲Ko-Fi</a>`
          }
        }
      }

      let splitData = await getSplit();
      var streamButtonText;
      if (splitData) {
        if (!document.querySelector('.lightning-buttons-block')) {
          if (streamEnabled) {
            streamButtonText = "⚡️" + streamAmount + "/min";
          } else {
            streamButtonText = "⚡️Stream";
          }
          //buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "boostagram" type="button" class="peertube-button orange-button ng-star-inserted">⚡️` + tipVerb + `</button>`
          buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "stream" type="button" class="peertube-button orange-button ng-star-inserted">` + streamButtonText + `</button>`
          let delta = 0;
          let lastStream = videoEl.currentTime;
          streamTimer = setInterval(async function () {
            currentTime = videoEl.currentTime;
            if (streamEnabled) {
              delta = (currentTime - lastStream).toFixed();
              if (debugEnabled) {
                console.log("counting for stream payments", delta);
              }
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
                  if (wallet.keysend && keysendEnabled) {
                    result = await boost(wallet.keysend, amount, null, userName, video.channel.displayName, video.name, "stream", video.uuid, video.channel.name + "@" + video.channel.host, video.channel.name, null, streamAmount, wallet.name);
                  } else if (wallet.lnurl && lnurlEnabled) {
                    result = await sendSats(wallet.lnurl, amount, "Streaming Sats", userName);
                    //walletData = await refreshWalletInfo(walletData.address);
                  }
                  if (debugEnabled) {
                    console.log("boosting " + wallet.address + " tried to send " + amount + " ended up with " + result);
                  }
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
      if (chatEnabled) {
        buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "bigchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▼" + `</button>`
        buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "smallchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▲" + `</button>`
        buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "closechat" type="button" class="peertube-button orange-button ng-star-inserted">` + "Chat" + `</button>`
      }
      if (buttonHTML) {
        elem.innerHTML = buttonHTML;
        addSpot.appendChild(elem);

      }
      if (chatEnabled) {
        let newContainer = document.createElement('div');
        newContainer.setAttribute('id', 'peertube-plugin-irc-container')
        newContainer.setAttribute('hidden', 'true');
        addSpot.append(newContainer)
        var container = document.getElementById('peertube-plugin-irc-container')

        if (!container) {
          logger.error('Cant found the irc chat container.')
        }
        let chatRoom = await getChatRoom(channelName);
        if (debugEnabled) {
          console.log("found chat room", chatRoom);
        }
        if (!chatRoom) {
          let shortInstance = instanceName.split(".")[0];
          let shortChannel = channelName.split("@")[0];
          chatRoom = "irc://irc.rizon.net/" + shortInstance + "-" + shortChannel;
          await setChatRoom(channelName, chatRoom);
        }
        let chatLink = "https://kiwiirc.com/nextclient/#" + chatRoom + '?nick=' + userName;
        if (userName === 'PeerTuber') {
          chatLink = chatLink + "???";
        }
        container.setAttribute("style", "display:flex");
        container.setAttribute('style', 'height:100%;width:100%;resize:both;display:flex;flex-direction:column;overflow:auto')
        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', chatLink);
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('id', "peertube-plugin-irc-iframe");
        container.append(iframe)
        let docIframe = document.getElementById('peertube-plugin-irc-iframe');
        docIframe.setAttribute('style', 'height:100%')
        docIframe.style.height = "100%";
        docIframe.style.width = "100%";
        docIframe.style.display = "flex";
        docIframe.style.flexDirection = "column";
        docIframe.style.resize = "both";
        docIframe.style.overflow = "auto";
      }
      if (splitData) {
        let addSpot2Find = document.getElementsByClassName("video-actions");
        //("second add spot", addSpot2Find);
        let addSpot2 = addSpot2Find[0];
        let addSpot3Find = document.getElementsByClassName("action-button")
        let addSpot3 = addSpot3Find[2];
        const transparentButton = document.createElement('button');
        transparentButton.innerHTML = "⚡️" + tipVerb;
        transparentButton.class = "action-button action-button-zap";
        transparentButton.className = "action-button action-button-zap";
        transparentButton.ariaPressed = "false";
        transparentButton.title = "Send Sats to " + channelName;
        transparentButton.id = "boostagram"
        addSpot2.insertBefore(transparentButton, addSpot3);
      }
      const boostButton = document.getElementById("boostagram");
      if (boostButton) {
        document.getElementById("boostagram").onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Support ' + channelName,
            content: ` `,
            close: true,
            // confirm: { value: 'X', action: () => { } },
          })
          await makeTipDialog(displayName);
          let tipButton = document.getElementById('modal-satbutton');

          if (tipButton) {
            tipButton.onclick = async function () {

              await buildTip(splitData, displayName, episodeName, episodeGuid, itemID);
            }
          }
        }
      }
      const streamButton = document.getElementById("stream");
      if (streamButton) {
        var popup;
        streamButton.title = "Stream Sats to " + channelName + " every minute of watching";
        document.getElementById("stream").onclick = async function () {
          popup = await peertubeHelpers.showModal({
            title: 'Stream sats for ' + channelName,
            content: ` `,
            close: true,
          })
          await makeStreamDialog(displayName);
          let streamButton = document.getElementById('modal-streambutton');
          if (streamButton) {
            streamButton.onclick = async function () {
              walletData = await buildTip(walletData, displayName, episodeName, episodeGuid, itemID);
            }
          }
        }
      }
      const streamlabsButton = document.getElementById("streamlabs")
      if (streamlabsButton) {
        streamlabsButton.onclick = async function () {
          var connectButtons = document.getElementsByClassName("u-button");
          window.open(streamlabsLink, 'popup', 'width=600,height=800');
        }
      }
      const tipeeeButton = document.getElementById("tipeee")
      if (tipeeeButton) {
        tipeeeButton.onclick = async function () {
          window.open(tipeeeLink, 'popup', 'width=1100,height=700');
        }
      }
      const bigChat = document.getElementById("bigchat");
      if (bigChat) {
        bigChat.title = "increase chat window height";
        bigChat.onclick = async function () {
          container.style.height = container.offsetHeight + 512 + 'px';
        }
      }
      const smallChat = document.getElementById("smallchat");
      if (smallChat) {
        smallChat.title = "Decrease chat window height";
        smallChat.onclick = async function () {
          container.style.height = container.offsetHeight - 512 + 'px';
        }
      }
      const closeChat = document.getElementById("closechat");
      let videoDisplay = document.getElementById("videojs-wrapper");
      let fullVideo = document.getElementById("video-wrapper");
      var oldVideo, oldChat
      if (closeChat) {

        closeChat.onclick = async function () {
          if (debugEnabled) {
            console.log("clicked", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log("width", container.clientWidth, videoDisplay.clientWidth, fullVideo.clientWidth);
            console.log("height", container.clientheight, videoDisplay.clientHeight);
          }
          if (closeChat.innerHTML === "Full Chat") {
            closeChat.title = "Close chat window";
            container.hidden = false;
            oldVideo = videoDisplay.clientWidth;
            videoDisplay.hidden = true;
            closeChat.innerHTML = "X";
            container.style.flexGrow = "1";
            container.style.flex = "wrap";
            //container.style.width = "2000px";
            //container.width = "2000px"
            //container.width = fullVideo.clientWidth;
            bigChat.hidden = false;
            smallChat.hidden = false;
          }
          else if (closeChat.innerHTML === "Chat") {
            closeChat.title = "make chat full screen"
            container.hidden = false;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Full Chat";
            bigChat.hidden = false;
            smallChat.hidden = false;
            if (container.clientHeight < 640) {
              container.style.height = "640px";
            }
          }
          else if (closeChat.innerHTML === "X") {
            container.hidden = true;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Chat";
            bigChat.hidden = true;
            smallChat.hidden = true;
            closeChat.title = "open chat panel";
          }
          if (debugEnabled) {
            console.log("after click", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log(container, videoDisplay);
          }
        }
      }
      const donationalertsButton = document.getElementById("donationalerts")
      if (donationalertsButton) {
        donationalertsButton.onclick = async function () {
          window.open(donationalertsLink, 'popup', 'width=600,height=800');
        }
      }
      const donatestreamButton = document.getElementById("donatestream")
      if (donatestreamButton) {
        donatestreamButton.onclick = async function () {
          window.open(donatestreamLink, 'popup', 'width=600,height=800');
        }
      }
      const kofiButton = document.getElementById("kofi")
      if (kofiButton) {
        kofiButton.onclick = async function () {
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
      channelName = channel;
      let splitData = await getSplit();
      //let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let panel = await getConfigPanel(splitData, channel);
      panelHack = panel;
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      let updateButton = document.getElementById("update-feed");
      document.getElementById("update-feed").onclick = async function () {
        setFeedID(channel, id.value);
        updateButton.innerText = "Saved!";
      }
      let chatRoom = document.getElementById("chatroom");
      let chatButton = document.getElementById("update-chat");
      document.getElementById("update-chat").onclick = async function () {
        setChatRoom(channel, chatRoom.value);
        chatButton.innerText = "Saved!";
      }
      let createButton = document.getElementById('create-split');
      if (createButton) {
        createButton.onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Add Lightning Address for' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let modal = (document.getElementsByClassName('modal-body'))
          //modal[0].setAttribute('class', 'lightning-button');
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = `Enter a lightning address or a Lightning Node Pubkey <br> <label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add Lightning Address</button>`;
          document.getElementById("add-split-final").onclick = async function () {
            let newAddress = document.getElementById("modal-split-address").value;
            let createApi = `/createsplit?channel=` + channel + `&splitaddress=` + newAddress;
            let createResult;
            try {
              createResult = await axios.get(basePath + createApi);
            } catch (e) {
              console.log("unable to create split\n", createApi, createResult);
              notifier.error(e, createResult, newAddress, newAddress.length);
              return;
            }
            if (createResult) {
              await closeModal();
              let newPanel = await getConfigPanel(createResult.data, channel);
              let channelUpdate = document.getElementsByClassName("form-group");
              channelUpdate[0].removeChild(panelHack)
              channelUpdate[0].appendChild(newPanel);
              panelHack = newPanel
              await assignEditButtons(createResult.data, channel);
              notifier.success("split create for " + channel);
              splitData = createResult.data
            } else {
              notifier.error("failed to CREATE split to " + channel);
            }
            let newPanel = await getConfigPanel(splitData, channel);
            let channelUpdate = document.getElementsByClassName("form-group");
            channelUpdate[0].removeChild(panelHack)
            channelUpdate[0].appendChild(newPanel);
            panelHack = newPanel;
            await assignEditButtons(splitData, channel);

          }
        }
      }
      let addButton = document.getElementById("add-split");
      if (addButton) {
        addButton.onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Add Split for' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let modal = (document.getElementsByClassName('modal-body'))
          //modal[0].setAttribute('class', 'lightning-button');
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = `Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br><label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="1"><br>
          <label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add New Split</button>`;
          let addFinalButton = document.getElementById("add-split-final")
          if (addFinalButton) {
            addFinalButton.onclick = async function () {
              this.innerText = "adding split";
              let addResult = await doAddSplit(channel);
              if (!addResult) {
                this.innerText = "Add New Split"
              }
            }
          }
        }
      }
      if (splitData && splitData.length > 0) {
        for (var slot in splitData) {
          var editButton = document.getElementById("edit-" + slot);
          if (editButton) {
            editButton.onclick = async function () {
              await peertubeHelpers.showModal({
                title: 'edit Split for ' + splitData[this.slot].address,
                content: ` `,
                close: true,
                confirm: { value: 'X', id: 'streamingsatsclose', action: () => { } },

              });
              let ks = splitData[this.slot].customKeysend;
              if (ks == undefined) {
                ks = false;
              }
              let html = await makeKeysendHtml(splitData, this.slot, ks);
              let modal = (document.getElementsByClassName('modal-body'))
              modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
              modal[0].innerHTML = html;
              assignSplitEditButtons(splitData, this.slot, channel, ks);
            }
          }
        }

      }
    }
  })

  async function sendSats(walletData, amount, message, from) {
    if (debugEnabled) {
      console.log("sending lnurl boost", walletData, amount, message, from);
    }
    if (!lnurlEnabled) {
      return;
    }
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
    //("parsint", parseInt(amount));
    let supported = true;
    try {
      await webln.enable();
    } catch {
      //await alertUnsupported();
      //makeQrDialog(invoice);
      supported = false;
    }
    if (debugEnabled) {
      console.log("webln enabled:", supported);
    }
    let urlCallback = encodeURI(walletData.callback);
    let urlComment = encodeURIComponent(comment);
    let invoiceApi = basePath + "/getinvoice?callback=" + urlCallback + "&amount=" + amount;
    if (comment != "") {
      invoiceApi = invoiceApi + "&message=" + urlComment;
    }
    try {
      result = await axios.get(invoiceApi);
    } catch (err) {
      console.log("error getting lnurl invoice"), invoiceApi;
      return;
    }
    let invoice = result.data.pr;
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
  async function boost(walletData, amount, message, from, channel, episode, type, episodeGuid, itemID, boostTotal, splitName) {
    if (debugEnabled) {
      console.log("boost called", walletData, amount, message, from, channel, episode, type, episodeGuid, channelName, itemID)
    }
    if (!keysendEnabled) {
      return;
    }
    try {
      let supported = await webln.enable();
    } catch {
      await alertUnsupported();
      return;
    }
    let remoteHost, remoteUser, localHost;
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
    if (channelName) {
      let parts = channelName.split("@");
      remoteUser = parts[0];
      if (parts.length > 1) {
        remoteHost = parts[1];
      }
    }
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKeyHack, customValue
    if (walletData.customData) {
      customKeyHack = walletData.customData[0].customKey;
      customValue = walletData.customData[0].customValue;
    }
    if (!splitName) {
      splitName = channel;
    }
    if (!boostTotal) {
      boostTotal = amount;
    }
    let version;
    try {
      let versionResult = await axios.get(basePath + "/getversion");
      if (versionResult && versionResult.data) {
        version = versionResult.data;
      }
    } catch (err) {
      console.log("error getting software version", basePath, err);
    }
    const boost = {
      action: type,
      value_msat: amount * 1000,
      value_msat_total: boostTotal * 1000,
      app_name: "PeerTube",
      app_version: version,
      name: splitName,
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
      let parts = boost.episode_guid.split('/');
      localHost = parts[2];
      if (remoteHost) {
        boost.episode_guid = "https://" + remoteHost + "/" + parts[3] + "/" + parts[4];
        localHost = parts[2];
      }
    }
    boost.boost_link = window.location.href;
    if (currentTime) {
      boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed();
    }
    if (channelName) {
      if (remoteHost) {
        boost.url = window.location.protocol + "//" + remoteHost + "/plugins/lightning/router/podcast2?channel=" + channelName
      } else {
        boost.url = window.location.protocol + "//" + localHost + "/plugins/lightning/router/podcast2?channel=" + channelName
      }

    }
    let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
    try {
      let itemId = await axios.get(itemApi);
      if (itemId) {
        boost.itemID = itemId.data;
      }
    } catch (err) {
    }
    let feedApi = basePath + "/getfeedid?channel=" + channelName;
    try {
      let feedId = await axios.get(feedApi);
      if (feedId) {
        boost.feedID = feedId.data;
      }
    } catch (err) {
    }
    let guid;
    let guidApi = basePath + "/getchannelguid?channel=" + channelName;
    try {
      guid = await axios.get(guidApi);
      if (guid) {
        boost.guid = guid.data;
      }
    } catch (err) {
    }
    let paymentInfo;
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
    if (debugEnabled) {
      console.log("payment info", paymentInfo);
    }
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
  async function getChatRoom(channel) {
    let chatApi = basePath + "/getchatroom?channel=" + channel;
    try {
      let chatRoom = await axios.get(chatApi);
      if (chatRoom) {
        return chatRoom.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setChatRoom(channel, chatRoom) {
    let chatApi = basePath + "/setchatroom?channel=" + channel + "&chatroom=" + encodeURIComponent(chatRoom);
    try {
      await axios.get(chatApi);
    } catch (err) {
      console.log("error attempting to set chatroom", err, channel, chatRoom);
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
  async function getWalletInfo() {
    if (debugEnabled) {
      console.log("get wallet info", videoName, accountName, channelName, instanceName);
    }
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
    if (debugEnabled) {
      console.log("api call for video wallet info", walletApi);
    }
    let walletData;
    try {
      walletData = await axios.get(walletApi);
    } catch {
      console.log("client unable to fetch wallet data\n", walletApi);
      return;
    }
    return walletData.data;
  }
  async function getSplit() {
    if (debugEnabled) {
      console.log("generating split request", videoName, accountName, channelName, instanceName)
    }
    let splitApi = basePath + "/getsplit";
    if (videoName) {
      if (instanceName == "hack") {
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
      if (instanceName == "hack") {
        splitApi = splitApi + "@" + instanceName;
      }
    }
    if (debugEnabled) {
      console.log("api call for split info", splitApi);
    }
    let splitData;
    try {
      splitData = await axios.get(splitApi);
    } catch {
      console.log("client unable to fetch split data\n", splitApi);
      return;
    }
    for (var split of splitData.data) {
      if (split.split < 1) {
        split.split = 1;
      }
    }
    return splitData.data;
  }
  async function refreshWalletInfo(address) {
    if (address) {
      if (address.indexOf("@") < 1) {
        console.log("not a valid address")
        return;
      }
      let walletApi = basePath + "/walletinfo?address=" + address;
      if (debugEnabled) {
        console.log("api call for video wallet refresh", walletApi);
      }
      let walletData;
      try {
        walletData = await axios.get(walletApi);
      } catch {
        console.log("client unable to fetch wallet data\n", walletApi);
        return;
      }
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
  async function getConfigPanel(splitInfo, channel) {
    let feedID = await getFeedID(channel);
    let chatRoom = await getChatRoom(channel);
    if (debugEnabled) {
      console.log("getting config panel", splitInfo, feedID, chatRoom, channel);
    }
    let html = `<br><label _ngcontent-msy-c247="" for="Wallet">Lightning Plugin Info</label>`
    if (splitInfo && (keysendEnabled || lnurlEnabled)) {
      if (splitInfo.length > 0) {
        html = html + "<table><th>Split %</th><th><center>Lighting Address</center></th><th>Address Type</th></tr>";
        for (var split in splitInfo) {
          let displayName = splitInfo[split].name;
          if (!displayName) {
            displayName = splitInfo[split].address;
          }
          html = html + "<tr><td>" + splitInfo[split].split + "</td><td>" + displayName + "</td>";
          if (splitInfo[split].keysend) {
            html = html + `<td>Keysend</td>`;
          } else if (splitInfo[split].customKeysend) {
            html = html + `<td>Node</td>`;
          } else if (splitInfo[split].lnurl) {
            html = html + "<td>LNURL Pay</td>";
          } else {
            html = html + "<td>unknown</td>"
          }
          if (!splitInfo[split].fee) {
            html = html + `<td><div class="peertube-button orange-button ng-star-inserted" slot="` + split + `" id="edit-` + split + `">edit</div></td>`;
            //html = html + `<td><button class="peertube-button orange-button ng-star-inserted" >edit</button></td>`;
          }
          html = html + "</tr>";
        }
        html = html + "</table>";
      }
      html = html + `<button type="button" id="add-split" class="peertube-button orange-button ng-star-inserted">Add Split</button>`
    } else {
      html = html + `<button type="button" id="create-split" class="peertube-button orange-button ng-star-inserted">Add Lightning Address</button>`

    }
    html = html + "<hr>"
    let rssFeedUrl = window.location.protocol + "//" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channel

    html = html + `For full Boostagram functionality on sites like <a href="https://saturn.fly.dev">SATurn</a> and <a href="https://conshax.app">Conshax></a> you will need to register your channels podcast 2.0 RSS feed on Podcast Index.  You can do that here <a href ="https://podcastindex.org/add?feed=` + rssFeedUrl + `">here</a>. This will also make audio versions of your videos available as a Podcast on modern Podcast apps. Once registered you can get the ID from the Podcast Index url for the channel`;
    html = html + "<br> Podcast Index Feed ID:";

    html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="id" name="id" value="` + feedID + `">`
    html = html + `<button type="button" id="update-feed" name="update-feed" class="peertube-button orange-button ng-star-inserted">Save</button>`
    html = html + "<br>podcast 2.0 RSS feed URL: " + rssFeedUrl;
    if (chatEnabled) {
      html = html + "<br> Channel Chatroom URL:";
      html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="chatroom" name="chatroom" value="` + chatRoom + `">`
      html = html + `<button type="button" id="update-chat" name="update-chat" class="peertube-button orange-button ng-star-inserted">Save</button>`
    }
    const panel = document.createElement('div');
    panel.setAttribute('class', 'lightning-button');
    panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    panel.innerHTML = html;
    return panel;
  }
  async function buildTip(splitData, displayName, episodeName, episodeGuid, itemID) {
    if (debugEnabled) {
      console.log("clicked on tip button", splitData, channelName, displayName, episodeName, episodeGuid, itemID);
    }
    let amount = document.getElementById('modal-sats').value;
    let message = document.getElementById('modal-message').value;
    let from = document.getElementById('modal-from').value;
    let weblnSupport = await checkWebLnSupport();
    lastTip = amount;
    //notifier.success(weblnSupport);
    let result;
    for (var wallet of splitData) {
      var splitAmount = amount * (wallet.split / 100);
      if (wallet.keysend && (weblnSupport) && keysendEnabled) {
        if (debugEnabled) {
          console.log("sending keysend boost", wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, channelName, itemID, amount, wallet.name)
        }
        result = await boost(wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, itemID, amount, wallet.name);
      } else if (wallet.lnurl && lnurlEnabled) {
        if (debugEnabled) {
          console.log("sending lnurl boost", wallet.lnurl, splitAmount, message, from);
        }
        result = await sendSats(wallet.lnurl, splitAmount, message, from);
        if (!result) {
          console.log("error sending lnurl boost", wallet.lnurl, splitAmount, message, from);
        }
      }
    }
    if (result) {
      closeModal();
      return;
    } else {
      document.getElementById("modal-message").value = "error attempting send " + tipVerb;
      return;
    }
  }
  async function makeQrDialog(invoice) {
    if (debugEnabled) {
      console.log("making qr dialog", invoice);
    }
    let html = "<h1>No WebLN Found</h1>" +
      `We were unable to find a WebLN provider in your browser to automate the ` + tipVerb +
      ` process. This is much easier if you get the <a href="https://getalby.com">Alby browser plug-in</a>` +
      `<br> If you have a wallet you can scan this qr code, open a local wallet, or copy/paste the ` +
      `provided code to a wallet` +
      //`<br><textarea STYLE="color: #000000; background-color: #ffffff; flex: 1;" rows="5" cols=64 id="ln-code" name="ln-code">` + invoice + `</textarea><br>` +
      //`<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="ln-code" name="ln-code" value="` + invoice + `"><br>` +
      `<button type="button" id="copy" name="copy" class="peertube-button orange-button ng-star-inserted">Copy to clipboard</button>` +
      `<a href="lightning:` + invoice + `"><button type="button" id="launch" name="launc" class="peertube-button orange-button ng-star-inserted">open local wallet</button></a>` +
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
  async function makeTipDialog() {
    if (debugEnabled) {
      console.log("making tip dialog", channelName);
    }
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
    modal[0].innerHTML = html;
    let modalHack = document.getElementsByClassName("modal-dialog");
    if (modalHack) {
      if (debugEnabled) {
        console.log("modal", modalHack, modalHack[0], modalHack[0].class);
      }
      modalHack[0].setAttribute('class', 'modal-dialog modal-dialog-centered modal-sm');
      document.getElementsByClassName("modal-content")[0].setAttribute('style', 'width:auto;');
    }
    let modalSatTip = document.getElementById("modal-sats");
    let modalCashTip = document.getElementById("modal-cashtip");
    if (modalSatTip) {
      modalSatTip.onchange = async function () {
        modalCashTip.textContent = (modalSatTip.value * convertRate).toFixed(2);
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
  async function makeStreamDialog() {
    if (debugEnabled) {
      console.log("making stream dialog", channelName);
    }
    let buttonText = '⚡️Stream⚡️';
    let html = `<div id="modal-streamdialog">
    <input STYLE="color: #000000; background-color: #ffffff;" type="checkbox" id="modal-streamsats" name="modal-streamsats" value="streamsats">
    <label>Stream Sats per minute:</label>
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-streamamount" name="modal-streamamount" value="`+ streamAmount + `" size="6">
    / $
    <input STYLE="color: #000000; background-color: #ffffff;"type="text" id="modal-cashamount" name="modal-cashamount" value="`+ (streamAmount * convertRate).toFixed(3) + `" size="6">
    </div>`;
    let modal = (document.getElementsByClassName('modal-body'))
    modal[0].innerHTML = html;
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
          menuStreamAmount.value = streamAmount;
        }
      }
    }
    if (modalCashStream) {
      modalCashStream.onchange = async function () {
        modalSatStream.value = (modalCashStream.value / convertRate).toFixed();
        streamAmount = modalSatStream.value;
        if (menuStreamAmount) {
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
          streamButtonText = "⚡️⌚";
        }
        butt.textContent = streamButtonText;
        if (menuChecker) {
          menuChecker.checked = streamEnabled;
        }
        let currentStreamAmount = document.getElementById('modal-streamamount');

        if (currentStreamAmount) {
          streamAmount = parseInt(currentStreamAmount.value);
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
  async function closeModal() {
    let butts = document.getElementsByClassName("ng-star-inserted")
    for (var butt of butts) {
      let iconName = butt.getAttribute("iconname");
      if (iconName == "cross") {
        butt.click();
        return true;
      }
    }
    return false;
  }
  async function assignSplitEditButtons(splitData, slot, channel, ks) {
    if (debugEnabled) {
      console.log("assigning split edits", slot, channel, ks);
    }
    document.getElementById("update-split").onclick = async function () {
      if (debugEnabled) {
        console.log("update split clicked", channel, slot, ks)
      }
      let updateResult = await doUpdateSplit(channel, slot, ks);
      let newPanel = await getConfigPanel(updateResult, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel;
      await assignEditButtons(updateResult, channel);
    }
    document.getElementById("remove-split").onclick = async function () {
      let removeResult = await doRemoveSplit(channel, slot);
      let newPanel = await getConfigPanel(removeResult, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel;
      await assignEditButtons(removeResult, channel);
    }
    let manualKeysend = document.getElementById("manualkeysend");
    manualKeysend.checked = ks;
    manualKeysend.onclick = async function () {
      if (debugEnabled) {
        console.log("custom keysend data", manualKeysend, slot, ks, splitData[slot].customKeysend);
      }
      if (splitData[slot].customKeysend == true) {
        splitData[slot].customKeysend = false;
        ks = false;
        manualKeysend.checked = false
      } else {
        splitData[slot].customKeysend = true;
        ks = true;
        manualKeysend.checked = true;
      }
      if (debugEnabled) {
        console.log("post toggle custom keysend data", manualKeysend, slot, ks, splitData[slot].customKeysend);
      }
      //splitData[slot].customKeysend = manualKeysend.checked;
      let html = await makeKeysendHtml(splitData, slot, ks);
      let modal = (document.getElementsByClassName('modal-body'))
      modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      modal[0].innerHTML = html;
      await assignSplitEditButtons(splitData, slot, channel, ks);
    }
  }
  async function assignEditButtons(splitData, channel) {
    if (splitData.length > 0) {
      let addButton = document.getElementById("add-split");
      if (addButton) {
        addButton.onclick = async function () {
          if (debugEnabled) {
            console.log("assigning edit butts!", splitData.length, channel);
          }
          await peertubeHelpers.showModal({
            title: 'Add Split for' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let modal = (document.getElementsByClassName('modal-body'))
          //modal[0].setAttribute('class', 'lightning-button');
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = `Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br><label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="1"><br>
          <label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add New Split</button>`;
          let addFinalButton = document.getElementById("add-split-final")
          if (addFinalButton) {
            addFinalButton.onclick = async function () {
              await doAddSplit(channel);
            }
          }
        }
      }
      for (var slot in splitData) {
        var editButton = document.getElementById("edit-" + slot);
        if (editButton) {
          editButton.onclick = async function () {
            let editSlot = this.slot;
            await peertubeHelpers.showModal({
              title: 'edit Split for ' + splitData[editSlot].address,
              content: ` `,
              close: true,
              confirm: { value: 'X', id: 'streamingsatsclose', action: () => { } },

            });
            let ks = splitData[slot].customKeysend
            if (ks == undefined) {
              ks = false;
            }
            let html = await makeKeysendHtml(splitData, editSlot, ks);
            let modal = (document.getElementsByClassName('modal-body'))
            modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
            modal[0].innerHTML = html;
            await assignSplitEditButtons(splitData, editSlot, channel, ks);
          }
        }
      }
    }

  }
  async function doUpdateSplit(channel, slot, ks) {
    if (debugEnabled) {
      console.log("Do update split", channel, slot, ks);
    }
    let newSplit = document.getElementById("modal-split-value").value;
    let newAddress = document.getElementById("modal-split-address").value;
    let newName = encodeURI(document.getElementById("modal-split-name").value);
    let customKeysend = document.getElementById("manualkeysend").checked
    if (debugEnabled) {
      console.log("New values from split dialog", customKeysend, newName, newAddress, newSplit, slot, ks);
    }
    if (ks) {
      var pubKey = document.getElementById("modal-split-pubkey").value
      var customKey = document.getElementById("modal-split-customkey").value
      var customValue = document.getElementById("modal-split-customvalue").value
    } else {
      var pubKey, customKey, customValue;
    }
    let updateApi = `/updatesplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress + `&slot=` + slot;
    if (newName) {
      updateApi = updateApi + `&name=` + newName;
    }
    if (ks) {
      updateApi = updateApi + `&customkeysend=true`
      if (customKey) {
        updateApi = updateApi + `&customkey=` + customKey;
      }
      if (customValue) {
        updateApi = updateApi + `&customvalue=` + customValue;
      }
      if (pubKey) {
        updateApi = updateApi + `&node=` + pubKey;
      }
    }
    let updateResult;
    try {
      updateResult = await axios.get(basePath + updateApi);
      await closeModal();
      notifier.success("updated " + channel + " splits");
      return updateResult.data;
    } catch {
      console.log("unable to update split\n", updateApi);
      notifier.error("unable to update splits for " + channel);
      return;
    }
  }
  async function doRemoveSplit(channel, slot) {
    let removeApi = `/removesplit?channel=` + channel + `&slot=` + slot;
    let removeResult;
    try {
      removeResult = await axios.get(basePath + removeApi);
      await closeModal();
      let newPanel = await getConfigPanel(removeResult.data, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel;
      notifier.success("Removed split");
      return removeResult.data;
    } catch {
      console.log("unable to remove split\n", removeApi);
      notifier.error("unable to remove split");
      return;
    }
  }
  async function doAddSplit(channel) {
    if (debugEnabled) {
      console.log("do add split called with ", channel);
    }
    let addApi;
    let newSplit = document.getElementById("modal-split-value").value;

    let newAddress = document.getElementById("modal-split-address").value;
    if (newAddress.length == 66) {
      let node = newAddress;
      newAddress = "custom"
      addApi = `/addsplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress;
      addApi = addApi + `&customkeysend=true&node=` + node + ``
    } else if (newAddress.indexOf("@") > 1) {
      addApi = `/addsplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress;
    } else {
      console.log("unable to add malformed split address", newAddress);
      notifier.error("Lightning address is neither an address or a valid server pubkey");
      return;
    }
    let addResult;
    if (debugEnabled) {
      console.log("attempting add split to channel", addApi);
    }
    try {
      addResult = await axios.get(basePath + addApi);
    } catch (e) {
      console.log("unable to add split\n", addApi, addResult);
      notifier.error(e);
      return;
    }
    if (addResult) {
      await closeModal();
      let newPanel = await getConfigPanel(addResult.data, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel
      await assignEditButtons(addResult.data, channel);
      notifier.success("split added to " + channel);
      return addResult.data;
    } else {
      await closeModal();
      notifier.error("failed to add split to " + channel);
      return;
    }
  }
  async function makeKeysendHtml(splitData, slot, ks) {
    if (debugEnabled) {
      console.log("making keysend edit panel", slot, ks);
    }
    let html;
    html = `<label for="name">Split Name:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-name" value="` + splitData[slot].name + `"><br>`;
    if (slot == 0) {
      html = html + `<label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" readonly value="` + splitData[slot].split + `"><br>`;
    } else {
      html = html + `<label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="` + splitData[slot].split + `"><br>`;
    }
    // html = html + "Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br>";

    if (ks) {
      html = html + `<label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address" readonly value ="` + splitData[slot].address + `"><br>`;
    } else {
      html = html + `<label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address" value ="` + splitData[slot].address + `"><br>`;
    }
    html = html + `<hr>  <input type="checkbox" id="manualkeysend" name="manualkeysend">`;
    html = html + `<label for="manualkeysend"> Custom Keysend Configuration</label><br>`;
    if (splitData[slot].keysend) {
      let status = splitData[slot].keysend.status;
      let pubKey = splitData[slot].keysend.pubkey;
      let customKey = splitData[slot].keysend.customData[0].customKey;
      let customValue = splitData[slot].keysend.customData[0].customValue;
      if (!customKey) {
        customKey = "";
      }
      if (!customValue) {
        customValue = "";
      }
      if (ks) {
        html = html + `<label for="address">Keysend pubkey:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-pubkey" value ="` + pubKey + `">`;
        html = html + `<br><label for="address">Custom Key:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-customkey" value ="` + customKey + `">`;
        html = html + `<br><label for="address">Custom Value:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-customvalue" value ="` + customValue + `">`;
      } else {
        html = html + "Keysend: " + status;
        html = html + "<br> Keysend pubkey: " + pubKey;
        html = html + "<br> keysend custom key:" + customKey;
        html = html + "<br> keysend custom value:" + customValue;
      }
    }
    if (splitData[slot].lnurl) {
      html = html + "<br> LNURL callback: " + splitData[slot].lnurl.callback;
    }
    html = html + `<hr><button class="peertube-button orange-button ng-star-inserted" slot= "` + slot + `" id="update-split">Update Split</button>`;
    if (slot != 0) {
      html = html + ` - <button class="peertube-button orange-button ng-star-inserted" slot= "` + slot + `" id="remove-split">remove this Split</button>`;
    }
    return html;
  }
}
export {
  register
}
